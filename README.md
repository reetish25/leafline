# Leafline — Sunflower Leaf-Disease Diagnosis Platform

Leafline is an end-to-end full-stack agricultural diagnosis and disease surveillance platform designed for sunflower growers (**User role**) and agronomists/platform operators (**Admin role**).

A grower captures or uploads a leaf image and progresses through a sequential 5-step diagnostic pipeline: foliar disease classification, side-by-side segmentation overlay, canopy severity health ratios, microclimate pathogen risk projection, and pesticide/dosage protocols with extension disclaimers. Platform administrators manage users, inspect all raw image submissions, triage low-confidence or high-severity scans in a review queue, manage a versioned pesticide reference table, register ML checkpoints, and adjust grower-facing platform controls.

---

## Architecture & Monorepo Structure

```
leafline/
├── README.md                     # Complete project documentation & quickstart
├── backend/                      # FastAPI Python REST backend
│   ├── .env.example              # Environment variables template
│   ├── requirements.txt          # Python packages (FastAPI, SQLAlchemy, PIL, etc.)
│   ├── inference.py              # ROOT EXPORT of the isolated ML model seam
│   ├── leafline.db               # SQLite database (auto-seeded on launch)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # Application entry point, CORS, startup hooks
│   │   ├── config.py             # App configurations, secrets, upload paths
│   │   ├── database.py           # SQLAlchemy engine & session maker
│   │   ├── models.py             # DB entities (User, Scan, Pesticide, Review, Model, Setting)
│   │   ├── schemas.py            # Pydantic v2 validation models
│   │   ├── auth.py               # Native bcrypt password hashing & JWT token verification
│   │   ├── inference.py          # STRICTLY ISOLATED ML CONTRACT SEAM (Classification, Segmentation, Risk)
│   │   ├── seed.py               # Database seeder with realistic synthetic sunflower leaf images
│   │   └── routes/
│   │       ├── auth.py           # /api/auth (Register, Login, Me, Profile & Consent)
│   │       ├── scans.py          # /api/scans (Upload, Diagnosis, My History, Details)
│   │       └── admin.py          # /api/admin (Regional Severity, Review Queue, Pesticides, Models, Settings)
│   ├── tests/
│   │   ├── test_inference.py     # Unit tests verifying mock input/output contracts
│   │   └── test_api.py           # Integration tests for auth, scans, pesticide versioning
│   └── uploads/                  # Storage directory for leaf captures and segmentation overlays
└── frontend/                     # React 18 + Vite + Tailwind CSS frontend
    ├── package.json
    ├── vite.config.js            # Vite config with API proxy to port 8000
    ├── tailwind.config.js        # Exact Leafline color palette & font configuration
    ├── index.html                # Google Fonts: Space Grotesk & Inter
    └── src/
        ├── App.jsx               # Main controller with role switching & view router
        ├── main.jsx              # DOM root mount
        ├── index.css             # Typography rules and print stylesheet
        ├── context/
        │   └── AuthContext.jsx   # Authentication context & token management
        ├── services/
        │   └── api.js            # Central API client
        ├── components/
        │   ├── Navbar.jsx        # Top header with role badge & view switcher
        │   ├── StatusStrip.jsx   # Admin system status bar (climate & inference health)
        │   ├── AdminSidebar.jsx  # Admin navigation shell
        │   ├── CameraCapture.jsx # getUserMedia live camera + shutter + retake + fallback
        │   ├── SideBySideView.jsx# Original leaf photo vs diseased overlay with zoom/legend
        │   ├── SeverityBar.jsx   # Two-tone healthy vs diseased bar + plant trend note
        │   ├── RiskSlider.jsx    # 0 to max forecast days slider with daily risk cards
        │   ├── TreatmentCard.jsx # Versioned pesticide & dosage with mandatory disclaimer
        │   └── PrintableReport.jsx# Standalone printable / downloadable PDF report
        └── pages/
            ├── Login.jsx         # Sign in with 1-click demo buttons
            ├── Register.jsx      # Account creation with explicit location consent
            ├── UserPipeline.jsx  # Sequential 5-step grower diagnostic workflow
            ├── UserHistory.jsx   # Past scans filterable by plant/field name
            ├── UserProfile.jsx   # Profile & geolocation consent management
            └── admin/
                ├── AdminDashboard.jsx # Regional severity intelligence table & KPIs
                ├── ReviewQueue.jsx    # Low-confidence & high-severity approval/escalation
                ├── Submissions.jsx    # Raw submissions gallery with full report links
                ├── PesticideTable.jsx # Full CRUD with version history tracking
                ├── ModelRegistry.jsx  # Benchmark stats (accuracy, latency, size) & set default
                ├── SystemSettings.jsx # Dynamic toggles (model opt-in, max days, limits)
                └── UserManagement.jsx # Customer account admin & role assignment
```

---

## Drop-In ML Model Seam (`backend/inference.py`)

> [!IMPORTANT]
> **No ML models are trained or designed here.** All predictive and analytical logic is strictly isolated in `backend/app/inference.py` (and re-exported at `backend/inference.py`).
>
> When real PyTorch / ONNX models arrive, **only this file needs to be modified.** The rest of the frontend, backend, routes, database, and UI remain completely untouched.

### Exact Typed Contracts

```python
# 1. Disease Classification
def predict(image_bytes: bytes, model_name: str = "default") -> dict:
    """
    Input:
        image_bytes: bytes (raw binary JPEG/PNG/WebP)
        model_name: str (identifier from ModelRegistry)
    Output:
        {
            "class_name": str,       # One of: "Immune", "Resistant", "MR", "MS", "S", "HS"
            "confidence": float,     # Confidence score between 0.0 and 1.0
            "probabilities": dict    # e.g. {"Immune": 0.02, "Resistant": 0.05, "MR": 0.88, ...}
        }
    """

# 2. Leaf-Severity Segmentation
def estimate_severity(image_bytes: bytes, class_name: str) -> dict:
    """
    Input:
        image_bytes: bytes
        class_name: str ("Immune" | "Resistant" | "MR" | "MS" | "S" | "HS")
    Output:
        {
            "healthy_pct": float,         # Healthy canopy % (0.0 - 100.0)
            "diseased_pct": float,        # Diseased lesion % (0.0 - 100.0)
            "overlay_image_bytes": bytes  # JPEG/PNG bytes with highlighted necrotic lesions
        }
    """

# 3. 15-Day Pathogen Risk Outlook
def project_risk(location: str, days: int, current_severity: float) -> list[dict]:
    """
    Input:
        location: str (e.g. "Salina, KS")
        days: int (0 to max_forecast_days)
        current_severity: float
    Output:
        List of day projections:
        [
            {
                "day_offset": int,
                "date": str,                     # "YYYY-MM-DD"
                "risk_score": float,             # 0.0 to 100.0
                "risk_level": str,               # "Low" | "Moderate" | "High" | "Severe"
                "projected_severity": float,     # Projected diseased leaf %
                "temperature_c": float,
                "relative_humidity_pct": float,
                "favorable_conditions": str      # Microclimate agronomic analysis
            }, ...
        ]
    """
```

---

## Visual Design System

The application strictly implements the required agricultural palette and typography:

| Color Token | Hex Code | Usage |
|-------------|----------|-------|
| **Paper** | `#EEF0E4` | Background surfaces and high-contrast card panels |
| **Ink** | `#202821` | Deep text, badges, and dark viewports |
| **Pine** | `#2F4B3C` | Primary branding, buttons, camera frames, navigation |
| **Moss** | `#5C7A4E` | Healthy tissue segments, positive statuses, high resistance |
| **Rust** | `#B5652D` | Diseased tissue warnings, moderate susceptibility (MS/S) |
| **Amber** | `#C98A3A` | Moderate risk, review queue badges, MR class |
| **Deep Rust** | `#7A2E1E` | Severe risk, high susceptibility (HS), escalated alerts |

- **Headings & Data Metrics**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
- **Body & Controls**: [Inter](https://fonts.google.com/specimen/Inter)

---

## Pre-Seeded Demo Accounts & Credentials

The database automatically seeds on startup with demo data, realistic synthetic sunflower leaf images, past scans, and triage items:

| Role | Email | Password | Access Privileges |
|------|-------|----------|-------------------|
| **Platform Admin** | `admin@leafline.ag` | `AdminPass123!` | Full admin dashboard, review queue, submissions, settings, versioned pesticides, model registry |
| **Grower (User)** | `grower@sunfield.farm` | `GrowerPass123!` | Sequential diagnostic pipeline, live camera capture, plant trend notes, personal scan history |
| **Grower 2** | `agri_dakota@prairie.org` | `PrairiePass123!` | Secondary farm account (Bismarck, ND) |

*(Quick 1-click login buttons are provided on the Login page for convenience.)*

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm (tested on Node.js v24 / npm 11)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the database seeder (seeds users, models, pesticides, scans, and synthetic leaf images)
python -m app.seed

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend REST API will be running at `http://127.0.0.1:8000` (interactive documentation available at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`. Requests to `/api` and `/uploads` are automatically proxied to `http://127.0.0.1:8000`.

---

## How to Add a New Model

Leafline has a pluggable model registry designed for ML researchers and agronomists:

1. **Drop Weights File**: Save your trained PyTorch checkpoint (e.g. `sunflower_resnet50.pt`) into `leafline/backend/models/`.
2. **Register in `registry.json`**: Add an entry into `leafline/backend/models/registry.json`:
   ```json
   {
     "name": "ResNet50-Sunflower",
     "version": "1.0.0",
     "weights_file": "sunflower_resnet50.pt",
     "architecture": "resnet50",
     "input_size": [224, 224],
     "mean": [0.485, 0.456, 0.406],
     "std": [0.229, 0.224, 0.225],
     "class_order": ["Immune", "Resistant", "MR", "MS", "S", "HS"],
     "accuracy": 0.884,
     "latency_ms": 32,
     "size_mb": 98.2,
     "is_default": false,
     "description": "Fine-tuned ResNet-50 baseline on sunflower foliar trials."
   }
   ```
3. **Architecture Builder** *(only if a new architecture family)*: If the architecture is not yet in `build_architecture()` in `leafline/backend/app/inference.py`, add a 3-line builder branch:
   ```python
   elif arch_name == "resnet50":
       m = models.resnet50(weights=None)
       m.fc = nn.Linear(m.fc.in_features, num_classes)
       return m
   ```
4. **Seed or Restart**: Run `python -m app.seed` or restart the server. The model registry automatically syncs and the model becomes available in the UI model picker.

---

### 3. Running Backend Tests

```bash
cd backend
python -m pytest -v
```

All 9 unit and integration tests (testing inference contracts, determinism, severity calculation, 15-day risk outlook, JWT authentication, scan submission, and versioned pesticide updates) will execute.

---

## Production Deployment Guide

- **Frontend**: Build with `npm run build` inside `frontend/`. Deploy the generated static `dist/` directory to **Vercel** or **Netlify**. Set the environment variable `VITE_API_BASE_URL` if deploying frontend and backend to different domains.
- **Backend**: Deploy `backend/` to **Render** or **Railway**. Set `SECRET_KEY`, `DATABASE_URL` (e.g. Postgres URL via `postgresql://...`), and `CORS_ORIGINS`.
- **Database**: To migrate from SQLite to Postgres, provide a Postgres connection string via `DATABASE_URL` in `.env` — SQLAlchemy models are fully compatible.
