from typing import List
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR, CORS_ORIGINS
from app.database import Base, engine, get_db
from app.routes import auth, scans, admin
from app.routes.scans import get_all_models_status
from app.schemas import ModelOut
from app.seed import seed_database

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Leafline API",
    description="Sunflower Leaf-Disease Diagnosis Platform Backend",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for leaf images and segmentation overlays
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API routes
app.include_router(auth.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    # Ensure seed data is populated on boot
    try:
        seed_database()
    except Exception as e:
        print(f"Warning during seed check: {e}")

@app.get("/api/models", response_model=List[ModelOut])
def get_platform_models(db: Session = Depends(get_db)):
    """Returns all 8 architectures with deployment status (available / not_deployed)."""
    return get_all_models_status(db)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Leafline Agri-Diagnostic Platform",
        "version": "1.0.0"
    }
