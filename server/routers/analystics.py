from collections import Counter

import pandas as pd
from fastapi import APIRouter, Query

import data_loader as dl

router = APIRouter()


# ── Analytics Charts ───────────────────────────────────────────────────────────

@router.get("/overview")
def get_overview():
    """Top-level KPIs for the Netflix dataset."""
    df = dl.netflix_df
    return {
        "total_titles": len(df),
        "movies": int((df["type"] == "Movie").sum()),
        "tv_shows": int((df["type"] == "TV Show").sum()),
        "unique_countries": int(df["country"].dropna().nunique()),
        "unique_ratings": int(df["rating"].dropna().nunique()),
        "release_year_range": {
            "min": int(df["release_year"].min()),
            "max": int(df["release_year"].max()),
        },
    }


@router.get("/content-by-type")
def content_by_type():
    """Movie vs TV Show split."""
    counts = dl.netflix_df["type"].value_counts()
    return [{"type": k, "count": int(v)} for k, v in counts.items()]


@router.get("/content-by-year")
def content_by_year():
    """Number of titles by release year."""
    df = dl.netflix_df
    counts = (
        df.groupby("release_year")["show_id"]
        .count()
        .reset_index()
        .rename(columns={"show_id": "count", "release_year": "year"})
        .sort_values("year")
    )
    return dl.df_to_records(counts)


@router.get("/content-added-by-year")
def content_added_by_year():
    """Number of titles added to Netflix per calendar year."""
    df = dl.netflix_df.copy()
    df["year_added"] = pd.to_datetime(df["date_added"], errors="coerce").dt.year
    counts = (
        df.dropna(subset=["year_added"])
        .groupby("year_added")["show_id"]
        .count()
        .reset_index()
        .rename(columns={"show_id": "count", "year_added": "year"})
        .sort_values("year")
    )
    counts["year"] = counts["year"].astype(int)
    return dl.df_to_records(counts)


@router.get("/content-by-rating")
def content_by_rating():
    """Title count per audience rating."""
    counts = (
        dl.netflix_df["rating"]
        .value_counts()
        .reset_index()
        .rename(columns={"rating": "rating", "count": "count"})
    )
    return dl.df_to_records(counts)


@router.get("/genres")
def top_genres(top_n: int = Query(15, ge=1, le=50)):
    """Top N genres derived from the listed_in field."""
    counter: Counter = Counter()
    for cell in dl.netflix_df["listed_in"].dropna():
        for g in cell.split(","):
            counter[g.strip()] += 1
    return [{"genre": g, "count": c} for g, c in counter.most_common(top_n)]


@router.get("/countries")
def top_countries(top_n: int = Query(15, ge=1, le=50)):
    """Top N production countries (multi-valued field)."""
    counter: Counter = Counter()
    for cell in dl.netflix_df["country"].dropna():
        for c in cell.split(","):
            c = c.strip()
            if c:
                counter[c] += 1
    return [{"country": c, "count": cnt} for c, cnt in counter.most_common(top_n)]


# ── Competitive Landscape ──────────────────────────────────────────────────────

@router.get("/competitive")
def competitive_landscape():
    """
    Combined paid + free streaming services sorted by subscriber count.
    Includes demographic, device, and historical subscriber columns.
    """
    paid = dl.paid_df.copy()
    free = dl.free_df.copy()
    paid["tier"] = "paid"
    free["tier"] = "free"

    combined = pd.concat([paid, free], ignore_index=True)

    desired_cols = [
        "service_name", "tier", "type", "subscribers_millions",
        "monthly_price_usd", "churn_rate_pct", "arpu_usd",
        "engagement_cluster", "content_type", "countries_available",
        "launch_year", "parent_company",
        "age_group_18_24_pct", "age_group_25_34_pct", "age_group_35_44_pct",
        "age_group_45_54_pct", "age_group_55_64_pct", "age_group_65_plus_pct",
        "device_android_pct", "device_ios_pct", "device_web_pct",
        "device_smart_tv_pct", "device_gaming_console_pct",
        "subscribers_2020_millions", "subscribers_2021_millions",
        "subscribers_2022_millions", "subscribers_2023_millions",
        "subscribers_2024_millions",
    ]
    available = [c for c in desired_cols if c in combined.columns]
    result = combined[available].sort_values("subscribers_millions", ascending=False)
    return dl.df_to_records(result)


@router.get("/growth")
def growth_predictions():
    """Paid service subscriber growth predictions."""
    df = dl.growth_df.copy()
    df = df.sort_values("predicted_subscribers", ascending=False)
    return dl.df_to_records(df)
