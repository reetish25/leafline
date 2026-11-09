"""
Leafline Database Seeder
Populates initial Admin, Grower demo accounts, platform Settings,
versioned Pesticide reference guide, and registers real models from registry.json.
No synthetic seed scans or fake leaf images.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

from app.database import engine, SessionLocal, Base
from app.models import User, Setting, ModelRegistry, PesticideEntry
from app.auth import hash_password

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
REGISTRY_PATH = MODELS_DIR / "registry.json"


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Demo Accounts
        admin_user = db.query(User).filter(User.email == "admin@leafline.ag").first()
        if not admin_user:
            admin_user = User(
                email="admin@leafline.ag",
                password_hash=hash_password("AdminPass123!"),
                role="admin",
                location="Fargo Agricultural Research Station, ND",
                location_consent=True,
                created_at=datetime.utcnow() - timedelta(days=60)
            )
            db.add(admin_user)
            print("Created admin account: admin@leafline.ag / AdminPass123!")

        grower_user = db.query(User).filter(User.email == "grower@sunfield.farm").first()
        if not grower_user:
            grower_user = User(
                email="grower@sunfield.farm",
                password_hash=hash_password("GrowerPass123!"),
                role="user",
                location="Salina, KS",
                location_consent=True,
                created_at=datetime.utcnow() - timedelta(days=30)
            )
            db.add(grower_user)
            print("Created grower account: grower@sunfield.farm / GrowerPass123!")

        demo_user2 = db.query(User).filter(User.email == "agri_dakota@prairie.org").first()
        if not demo_user2:
            demo_user2 = User(
                email="agri_dakota@prairie.org",
                password_hash=hash_password("PrairiePass123!"),
                role="user",
                location="Bismarck, ND",
                location_consent=True,
                created_at=datetime.utcnow() - timedelta(days=15)
            )
            db.add(demo_user2)

        db.commit()

        # 2. Seed Platform Settings
        default_settings = [
            ("manual_model_selection_enabled", "true", "Controls whether growers can opt-in to select specific inference models"),
            ("max_forecast_days", "15", "Maximum projection window users can select on risk slider"),
            ("images_per_scan", "1", "Maximum leaf images accepted per single diagnosis scan"),
            ("review_confidence_threshold", "0.70", "Scans with model confidence below this are held in review queue"),
            ("review_severity_threshold", "60.0", "Scans with diseased leaf area above this % are held for review"),
        ]
        for key, val, desc in default_settings:
            s = db.query(Setting).filter(Setting.key == key).first()
            if not s:
                db.add(Setting(key=key, value=val, description=desc))
        db.commit()
        print("Seeded platform settings.")

        # 3. Seed Model Registry from registry.json only
        if REGISTRY_PATH.exists():
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                registry_data = json.load(f)
            reg_models = registry_data.get("models", [])

            # Get set of valid model names
            valid_names = {m["name"] for m in reg_models}

            # Remove models that no longer exist in registry.json
            for existing in db.query(ModelRegistry).all():
                if existing.name not in valid_names:
                    db.delete(existing)
            db.commit()

            for m in reg_models:
                entry = db.query(ModelRegistry).filter(ModelRegistry.name == m["name"]).first()
                acc_val = float(m["accuracy"]) if m.get("accuracy") is not None else None
                if not entry:
                    entry = ModelRegistry(
                        name=m["name"],
                        version=m.get("version", "1.0.0"),
                        accuracy=acc_val,
                        latency_ms=int(m.get("latency_ms", 45)),
                        size_mb=float(m.get("size_mb", 8.75)),
                        is_default=bool(m.get("is_default", False)),
                        description=m.get("description", "")
                    )
                    db.add(entry)
                else:
                    entry.version = m.get("version", entry.version)
                    entry.accuracy = acc_val
                    entry.latency_ms = int(m.get("latency_ms", entry.latency_ms))
                    entry.size_mb = float(m.get("size_mb", entry.size_mb))
                    entry.is_default = bool(m.get("is_default", entry.is_default))
                    entry.description = m.get("description", entry.description)
            db.commit()
            print(f"Seeded ModelRegistry with {len(reg_models)} model(s) from registry.json.")

        # 4. Seed Versioned Pesticide Reference Table
        pesticides = [
            # Group 1: Immune / Resistant
            {
                "entry_group_id": "pest_group_immune",
                "severity_band": "Immune/Resistant",
                "active_ingredient": "Bacillus amyloliquefaciens strain D747 (Double Nickel 55)",
                "dosage": "0.5 - 1.5 lbs / acre via foliage spray",
                "source": "Kansas State University Extension Bulletin MF-3103 (2025)",
                "version": 1,
                "is_active": True,
            },
            # Group 2: MR / MS
            {
                "entry_group_id": "pest_group_mrms",
                "severity_band": "MR/MS",
                "active_ingredient": "Azoxystrobin 22.9% (Quadris Flowable Fungicide)",
                "dosage": "6.0 - 9.0 fl oz / acre in 15 gal water minimum",
                "source": "NDSU Extension Sunflower Disease & Management Guide PP-1785",
                "version": 1,
                "is_active": True,
            },
            # Group 3: S / HS - demonstrate versioning: prior version archived
            {
                "entry_group_id": "pest_group_shs",
                "severity_band": "S/HS",
                "active_ingredient": "Pyraclostrobin (Headline Fungicide)",
                "dosage": "6.0 - 9.0 fl oz / acre",
                "source": "USDA Crop Protection Compendium v4.2",
                "version": 1,
                "is_active": False,
            },
            {
                "entry_group_id": "pest_group_shs",
                "severity_band": "S/HS",
                "active_ingredient": "Pyraclostrobin 21.26% + Fluxapyroxad 21.26% (Priaxor)",
                "dosage": "4.0 - 8.0 fl oz / acre with non-ionic surfactant (0.25% v/v)",
                "source": "High Plains Sunflower Production Guide (Revision 2026)",
                "version": 2,
                "is_active": True,
            },
        ]
        for p in pesticides:
            exists = db.query(PesticideEntry).filter(
                PesticideEntry.entry_group_id == p["entry_group_id"],
                PesticideEntry.version == p["version"]
            ).first()
            if not exists:
                db.add(PesticideEntry(**p))
        db.commit()
        print("Seeded versioned pesticide reference table.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
