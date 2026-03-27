import math
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

netflix_df: pd.DataFrame = pd.read_csv(DATA_DIR / "netflix_titles_2.csv")
paid_df: pd.DataFrame = pd.read_csv(DATA_DIR / "paid_video_streaming_services.csv")
free_df: pd.DataFrame = pd.read_csv(DATA_DIR / "free_video_streaming_services.csv")
growth_df: pd.DataFrame = pd.read_csv(DATA_DIR / "paid_video_growth_predictions.csv")

for _df in [netflix_df, paid_df, free_df, growth_df]:
    _df.where(pd.notnull(_df), None, inplace=True)


def _clean_value(v):
    """Convert any value to a plain Python JSON-safe type."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if math.isnan(v) else float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if isinstance(v, (np.ndarray,)):
        return v.tolist()
    return v


def df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to a list of dicts with all numpy types cleaned."""
    return [
        {k: _clean_value(v) for k, v in row.items()}
        for row in df.to_dict(orient="records")
    ]


def row_to_dict(row: pd.Series) -> dict:
    """Convert a single Series row to a clean JSON-safe dict."""
    return {k: _clean_value(v) for k, v in row.items()}