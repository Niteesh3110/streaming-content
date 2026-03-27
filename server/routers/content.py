from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

import data_loader as dl

router = APIRouter()


class MetadataUpdate(BaseModel):
    title: Optional[str] = None
    director: Optional[str] = None
    cast: Optional[str] = None
    country: Optional[str] = None
    rating: Optional[str] = None
    listed_in: Optional[str] = None
    description: Optional[str] = None
    date_added: Optional[str] = None
    release_year: Optional[int] = None
    duration: Optional[str] = None


# ── /filters must be declared before /{show_id} to avoid route shadowing ──────

@router.get("/filters")
def get_filters():
    df = dl.netflix_df
    types = sorted(df["type"].dropna().unique().tolist())
    ratings = sorted(df["rating"].dropna().unique().tolist())
    genres = sorted({
        g.strip()
        for cell in df["listed_in"].dropna()
        for g in cell.split(",")
    })
    countries = sorted({
        c.strip()
        for cell in df["country"].dropna()
        for c in cell.split(",")
        if c.strip()
    })
    return {"types": types, "ratings": ratings, "genres": genres, "countries": countries}


# ── Content Inventory Table ────────────────────────────────────────────────────

@router.get("/")
def list_content(
    page: int = Query(1, ge=1, description="1-based page number"),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search title, director, or cast"),
    type: Optional[str] = None,
    rating: Optional[str] = None,
    genre: Optional[str] = Query(None, description="Partial match against listed_in"),
    country: Optional[str] = Query(None, description="Partial match against country"),
    sort_by: str = Query("title", pattern="^(title|release_year|date_added|type|rating|duration)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
):
    df = dl.netflix_df.copy()

    if search:
        mask = (
            df["title"].str.contains(search, case=False, na=False)
            | df["director"].str.contains(search, case=False, na=False)
            | df["cast"].str.contains(search, case=False, na=False)
        )
        df = df[mask]

    if type:
        df = df[df["type"].str.lower() == type.lower()]
    if rating:
        df = df[df["rating"].str.lower() == rating.lower()]
    if genre:
        df = df[df["listed_in"].str.contains(genre, case=False, na=False)]
    if country:
        df = df[df["country"].str.contains(country, case=False, na=False)]

    if sort_by in df.columns:
        df = df.sort_values(sort_by, ascending=(sort_order == "asc"), na_position="last")

    total = len(df)
    skip = (page - 1) * limit
    page_df = df.iloc[skip : skip + limit]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, (total + limit - 1) // limit),
        "items": dl.df_to_records(page_df),
    }


@router.get("/{show_id}")
def get_title(show_id: str):
    df = dl.netflix_df
    row = df[df["show_id"] == show_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Title '{show_id}' not found")
    return dl.row_to_dict(row.iloc[0])


# ── Metadata Tagger ────────────────────────────────────────────────────────────

@router.put("/{show_id}")
def update_metadata(show_id: str, update: MetadataUpdate):
    """Metadata Tagger: patch one or more fields on a title."""
    df = dl.netflix_df
    indices = df.index[df["show_id"] == show_id].tolist()
    if not indices:
        raise HTTPException(status_code=404, detail=f"Title '{show_id}' not found")

    fields = update.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    row_idx = indices[0]
    for field, value in fields.items():
        dl.netflix_df.at[row_idx, field] = value

    return dl.row_to_dict(dl.netflix_df.loc[row_idx])
