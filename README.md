# StreamDash — Streaming Content Management & Analytics Dashboard

A full-stack analytics dashboard for exploring Netflix content data and competitive streaming market intelligence. Built with **Next.js 16**, **FastAPI**, and **Pandas**.

---

## Features

### Content Library
Browse and search 8,800+ Netflix titles with server-side pagination, multi-column sorting, and cascading filters (type, rating, genre, country).

### Metadata Tagger
Inline editing interface to update any field on a title — director, cast, genres, description, and more — via a clean dialog form backed by a REST `PUT` endpoint.

### Data Audit Panel
Dataset quality analysis with completeness scoring, per-column null breakdowns (visualized as a color-coded bar chart), duplicate detection, and full field-level statistics (dtype, unique count, min/max/mean).

### Analytics Charts
Six interactive Recharts visualizations — content by type (pie), titles added per year (area), releases by year (area), distribution by rating, top 15 genres, and top 15 production countries — plus a row of KPI cards.

### Competitive Landscape
Cross-platform comparison of 100+ paid and free streaming services with subscriber trend lines (2020–2024), ARPU comparisons, growth predictions, and a full sortable data table.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (radix-nova), dark mode |
| Charts | Recharts 3 |
| Table | TanStack Table v8 |
| HTTP Client | Axios |
| Backend | FastAPI, Uvicorn |
| Data | Pandas, NumPy |
| Language | Python 3.12 |

---

## Project Structure

```
streaming-dashboard/
├── client/                          # Next.js frontend
│   ├── app/
│   │   ├── content/page.tsx         # Content Library route
│   │   ├── audit/page.tsx           # Data Audit route
│   │   ├── analytics/page.tsx       # Analytics route
│   │   └── competitive/page.tsx     # Competitive Landscape route
│   ├── components/
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   ├── content/
│   │   │   ├── ContentPanel.tsx     # Paginated table + filters
│   │   │   └── MetadataTagger.tsx   # Edit dialog
│   │   ├── audit/AuditPanel.tsx     # Quality audit tabs
│   │   ├── analytics/AnalyticsPanel.tsx
│   │   └── competitive/CompetitivePanel.tsx
│   └── lib/api.ts                   # Typed Axios API client
│
└── server/                          # FastAPI backend
    ├── main.py                      # App entry point + CORS
    ├── data_loader.py               # CSV loading + serialization helpers
    ├── routers/
    │   ├── content.py               # /api/content — inventory + tagger
    │   ├── audit.py                 # /api/audit — quality analysis
    │   └── analystics.py            # /api/analytics — charts + competitive
    └── data/                        # CSV datasets
        ├── netflix_titles_2.csv     # 8,807 Netflix titles
        ├── paid_video_streaming_services.csv
        ├── free_video_streaming_services.csv
        └── paid_video_growth_predictions.csv
```

---

## API Reference

### Content — `/api/content`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Paginated titles with search, filter, sort |
| `GET` | `/filters` | Filter dropdown options |
| `GET` | `/{show_id}` | Single title detail |
| `PUT` | `/{show_id}` | Update title metadata |

### Audit — `/api/audit`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/summary` | Completeness score, null counts, duplicate count |
| `GET` | `/missing` | Per-column null analysis |
| `GET` | `/duplicates` | Duplicate title rows |
| `GET` | `/field-stats` | dtype, unique count, min/max/mean per column |

### Analytics — `/api/analytics`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/overview` | Top-level KPIs |
| `GET` | `/content-by-type` | Movie vs TV Show split |
| `GET` | `/content-by-year` | Titles by release year |
| `GET` | `/content-added-by-year` | Titles added to Netflix by year |
| `GET` | `/content-by-rating` | Distribution by audience rating |
| `GET` | `/genres` | Top N genres |
| `GET` | `/countries` | Top N production countries |
| `GET` | `/competitive` | Paid + free services comparison |
| `GET` | `/growth` | Subscriber growth predictions |

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+

### Backend

```bash
cd server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Dataset

- **Netflix Titles** — 8,807 movies and TV shows with title, director, cast, country, rating, genres, and description
- **Paid Streaming Services** — 60+ services with subscriber counts, pricing, ARPU, churn rate, demographic breakdowns, and device distribution
- **Free Streaming Services** — 50+ ad-supported and freemium platforms
- **Growth Predictions** — Projected subscriber counts and revenue forecasts

---

## Author

Built by [Niteesh](https://github.com/Niteesh3110)
