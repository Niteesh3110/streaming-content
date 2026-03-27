from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import content, audit, analystics

app = FastAPI(
    title="Streaming Dashboard API",
    description="Backend for the Streaming Content Management & Analytics Dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router, prefix="/api/content", tags=["Content"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(analystics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Streaming Dashboard API is running"}
