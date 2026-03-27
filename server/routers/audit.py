import pandas as pd
from fastapi import APIRouter

import data_loader as dl

router = APIRouter()


# ── Data Audit Panel ───────────────────────────────────────────────────────────

@router.get("/summary")
def get_summary():
    """High-level quality overview of the Netflix dataset."""
    df = dl.netflix_df
    total = len(df)
    rows_with_nulls = int(df.isnull().any(axis=1).sum())
    null_counts = df.isnull().sum()

    return {
        "total_records": total,
        "complete_records": total - rows_with_nulls,
        "records_with_nulls": rows_with_nulls,
        "completeness_pct": round((total - rows_with_nulls) / total * 100, 2),
        "duplicate_titles": int(df.duplicated(subset=["title"], keep=False).sum()),
        "total_columns": len(df.columns),
        "columns_with_nulls": int((null_counts > 0).sum()),
    }


@router.get("/missing")
def get_missing():
    """Per-column null analysis, sorted by missing count descending."""
    df = dl.netflix_df
    total = len(df)
    result = []
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        result.append({
            "column": col,
            "missing_count": null_count,
            "missing_pct": round(null_count / total * 100, 2),
            "present_count": total - null_count,
            "dtype": str(df[col].dtype),
        })
    return sorted(result, key=lambda x: x["missing_count"], reverse=True)


@router.get("/duplicates")
def get_duplicates():
    """All rows whose title appears more than once."""
    df = dl.netflix_df
    dupes = df[df.duplicated(subset=["title"], keep=False)].copy()
    dupes = dupes.sort_values("title")
    return {
        "count": len(dupes),
        "items": dl.df_to_records(dupes),
    }


@router.get("/field-stats")
def get_field_stats():
    """Per-column statistics: dtype, unique count, nulls, and numeric range."""
    df = dl.netflix_df
    stats = []
    for col in df.columns:
        col_data = df[col].dropna()
        entry: dict = {
            "column": col,
            "dtype": str(df[col].dtype),
            "unique_values": int(col_data.nunique()),
            "null_count": int(df[col].isnull().sum()),
            "sample_values": col_data.head(3).tolist(),
        }
        if pd.api.types.is_numeric_dtype(df[col]) and len(col_data):
            entry["min"] = float(col_data.min())
            entry["max"] = float(col_data.max())
            entry["mean"] = round(float(col_data.mean()), 2)
        stats.append(entry)
    return stats
