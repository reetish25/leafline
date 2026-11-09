import json
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models import User, Scan, Setting, ReviewQueue, ModelRegistry, PesticideEntry
from app.schemas import ScanOut, ScanDetailOut, DayOutlook, RecommendationOut, ModelOut
from app.auth import get_current_user
from app.inference import predict, estimate_severity, project_risk

router = APIRouter(prefix="/scans", tags=["Scans"])

def get_setting_value(db: Session, key: str, default: str) -> str:
    s = db.query(Setting).filter(Setting.key == key).first()
    return s.value if s else default

def map_severity_band(class_name: str) -> str:
    if class_name in ["Immune", "Resistant"]:
        return "Immune/Resistant"
    elif class_name in ["MR", "MS"]:
        return "MR/MS"
    else:
        return "S/HS"

@router.post("", response_model=ScanDetailOut, status_code=status.HTTP_201_CREATED)
async def create_scan(
    image: UploadFile = File(...),
    plant_label: Optional[str] = Form(None),
    model_requested: Optional[str] = Form(None),
    forecast_days: int = Form(7),
    location: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Enforce Admin settings for forecast days
    max_days_setting = int(get_setting_value(db, "max_forecast_days", "15"))
    effective_forecast_days = max(0, min(forecast_days, max_days_setting))

    # 2. Enforce manual model selection setting
    manual_model_allowed = get_setting_value(db, "manual_model_selection_enabled", "true").lower() == "true"
    active_model_name = "MobileNetV2"

    default_model_entry = db.query(ModelRegistry).filter(ModelRegistry.is_default == True).first()
    if default_model_entry:
        active_model_name = default_model_entry.name

    if model_requested:
        if not manual_model_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual model selection is currently disabled by administrator."
            )
        # Check if requested model exists and is deployed
        exists = db.query(ModelRegistry).filter(func.lower(ModelRegistry.name) == func.lower(model_requested)).first()
        if not exists:
            all_archs = ["MobileNetV2", "EfficientNetB0", "ResNet50", "DenseNet121", "InceptionV3", "VGG16", "ViT-B16", "Xception"]
            arch_match = next((a for a in all_archs if a.lower() == model_requested.lower()), None)
            if arch_match:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model '{arch_match}' is not deployed yet. Please select an available model (MobileNetV2, EfficientNetB0, Xception)."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model '{model_requested}' is not deployed yet. Available models: MobileNetV2, EfficientNetB0, Xception."
                )
        active_model_name = exists.name

    # 3. Read image bytes and validate
    image_bytes = await image.read()
    if not image_bytes or len(image_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image file is required."
        )

    # 4. Run Isolated ML Inference (Mock drop-in contract)
    pred_result = predict(image_bytes, model_name=active_model_name)
    predicted_class = pred_result["class_name"]
    confidence = pred_result["confidence"]

    # 5. Run Isolated Severity Segmentation (Mock drop-in contract)
    sev_result = estimate_severity(image_bytes, class_name=predicted_class, model_name=active_model_name)
    healthy_pct = sev_result["healthy_pct"]
    diseased_pct = sev_result["diseased_pct"]
    overlay_bytes = sev_result["overlay_image_bytes"]

    # 6. Save original image and overlay image to disk
    file_id = str(uuid.uuid4())
    ext = Path(image.filename).suffix.lower() if image.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    orig_filename = f"{file_id}_orig{ext}"
    overlay_filename = f"{file_id}_overlay.jpg"

    orig_path = UPLOAD_DIR / orig_filename
    overlay_path = UPLOAD_DIR / overlay_filename

    with open(orig_path, "wb") as f:
        f.write(image_bytes)

    with open(overlay_path, "wb") as f:
        f.write(overlay_bytes)

    # 7. Check Review Queue Thresholds
    conf_thresh = float(get_setting_value(db, "review_confidence_threshold", "0.70"))
    sev_thresh = float(get_setting_value(db, "review_severity_threshold", "60.0"))

    scan_status = "approved"
    trigger_reason = None

    if confidence < conf_thresh:
        scan_status = "pending_review"
        trigger_reason = f"Low model confidence ({round(confidence * 100, 1)}% < {round(conf_thresh * 100)}% threshold)"
    elif diseased_pct > sev_thresh:
        scan_status = "pending_review"
        trigger_reason = f"High disease severity ({diseased_pct}% > {sev_thresh}% threshold)"

    # Effective location (user location if consent given or scan-specified location)
    eff_location = location or (current_user.location if current_user.location_consent else "Unknown Location")

    # 8. Create Scan Record in DB
    scan = Scan(
        user_id=current_user.id,
        image_path=f"/uploads/{orig_filename}",
        overlay_image_path=f"/uploads/{overlay_filename}",
        plant_label=plant_label.strip() if plant_label else None,
        location=eff_location,
        predicted_class=predicted_class,
        confidence=confidence,
        severity_pct=diseased_pct,
        healthy_pct=healthy_pct,
        model_used=active_model_name,
        forecast_days=effective_forecast_days,
        probabilities_json=json.dumps(pred_result.get("probabilities", {})),
        status=scan_status,
    )
    db.add(scan)
    db.flush()

    # If flagged, add to ReviewQueue (safeguard against duplicates or orphans)
    if scan_status == "pending_review":
        existing_review = db.query(ReviewQueue).filter(ReviewQueue.scan_id == scan.id).first()
        if existing_review:
            existing_review.status = "pending"
            existing_review.trigger_reason = trigger_reason
            existing_review.reviewed_by = None
            existing_review.reviewed_at = None
            existing_review.notes = None
        else:
            review_entry = ReviewQueue(
                scan_id=scan.id,
                status="pending",
                trigger_reason=trigger_reason,
            )
            db.add(review_entry)
    else:
        existing_review = db.query(ReviewQueue).filter(ReviewQueue.scan_id == scan.id).first()
        if existing_review:
            db.delete(existing_review)

    db.commit()
    db.refresh(scan)

    # 9. Compute plant trend note if plant_label is present
    trend_note = None
    if scan.plant_label:
        prev_scan = (
            db.query(Scan)
            .filter(
                Scan.user_id == current_user.id,
                Scan.plant_label == scan.plant_label,
                Scan.id != scan.id
            )
            .order_by(desc(Scan.created_at))
            .first()
        )
        if prev_scan:
            diff = round(scan.severity_pct - prev_scan.severity_pct, 1)
            prev_date = prev_scan.created_at.strftime("%b %d")
            if diff > 0:
                trend_note = f"Diseased area increased by {diff}% since prior scan on {prev_date} ({prev_scan.severity_pct}%)."
            elif diff < 0:
                trend_note = f"Diseased area decreased by {abs(diff)}% since prior scan on {prev_date} ({prev_scan.severity_pct}%)."
            else:
                trend_note = f"Severity remained unchanged at {scan.severity_pct}% compared to scan on {prev_date}."
        else:
            trend_note = "First baseline diagnostic scan recorded for this plant/field."

    # 10. Generate Risk Outlook Projections (Isolated mock seam)
    risk_outlook_data = project_risk(
        location=scan.location,
        days=scan.forecast_days,
        current_severity=scan.severity_pct
    )
    risk_projections = [DayOutlook(**item) for item in risk_outlook_data]

    # 11. Fetch Versioned Pesticide Recommendation
    band = map_severity_band(scan.predicted_class)
    pesticide = (
        db.query(PesticideEntry)
        .filter(PesticideEntry.severity_band == band, PesticideEntry.is_active == True)
        .order_by(desc(PesticideEntry.version))
        .first()
    )

    rec_out = None
    if pesticide:
        rec_out = RecommendationOut(
            severity_band=pesticide.severity_band,
            active_ingredient=pesticide.active_ingredient,
            dosage=pesticide.dosage,
            source=pesticide.source,
            disclaimer="Confirm with your local agricultural extension office for severe or recurring cases."
        )

    return ScanDetailOut(
        scan=ScanOut.model_validate(scan),
        risk_projection=risk_projections,
        recommendation=rec_out,
        trend_note=trend_note
    )

@router.get("/mine", response_model=List[ScanOut])
def get_my_scans(
    plant_label: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Scan).filter(Scan.user_id == current_user.id)
    if plant_label:
        query = query.filter(Scan.plant_label.ilike(f"%{plant_label.strip()}%"))
    scans = query.order_by(desc(Scan.created_at)).all()
    return scans

@router.get("/{scan_id}", response_model=ScanDetailOut)
def get_scan_details(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Access control: users can only see their own scans; admins can see any
    if current_user.role != "admin" and scan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this scan")

    # Trend note
    trend_note = None
    if scan.plant_label:
        prev_scan = (
            db.query(Scan)
            .filter(
                Scan.user_id == scan.user_id,
                Scan.plant_label == scan.plant_label,
                Scan.created_at < scan.created_at
            )
            .order_by(desc(Scan.created_at))
            .first()
        )
        if prev_scan:
            diff = round(scan.severity_pct - prev_scan.severity_pct, 1)
            prev_date = prev_scan.created_at.strftime("%b %d")
            if diff > 0:
                trend_note = f"Diseased area increased by {diff}% since prior scan on {prev_date} ({prev_scan.severity_pct}%)."
            elif diff < 0:
                trend_note = f"Diseased area decreased by {abs(diff)}% since prior scan on {prev_date} ({prev_scan.severity_pct}%)."
            else:
                trend_note = f"Severity remained unchanged at {scan.severity_pct}% compared to scan on {prev_date}."

    # Risk projections
    risk_outlook_data = project_risk(
        location=scan.location,
        days=scan.forecast_days,
        current_severity=scan.severity_pct
    )
    risk_projections = [DayOutlook(**item) for item in risk_outlook_data]

    # Recommendation
    band = map_severity_band(scan.predicted_class)
    pesticide = (
        db.query(PesticideEntry)
        .filter(PesticideEntry.severity_band == band, PesticideEntry.is_active == True)
        .order_by(desc(PesticideEntry.version))
        .first()
    )

    rec_out = None
    if pesticide:
        rec_out = RecommendationOut(
            severity_band=pesticide.severity_band,
            active_ingredient=pesticide.active_ingredient,
            dosage=pesticide.dosage,
            source=pesticide.source,
            disclaimer="Confirm with your local agricultural extension office for severe or recurring cases."
        )

    return ScanDetailOut(
        scan=ScanOut.model_validate(scan),
        risk_projection=risk_projections,
        recommendation=rec_out,
        trend_note=trend_note
    )

ALL_ARCHITECTURES = [
    "MobileNetV2",
    "EfficientNetB0",
    "ResNet50",
    "DenseNet121",
    "InceptionV3",
    "VGG16",
    "ViT-B16",
    "Xception",
]

def get_all_models_status(db: Session) -> List[ModelOut]:
    db_models = {m.name.lower(): m for m in db.query(ModelRegistry).all()}
    result = []
    for arch in ALL_ARCHITECTURES:
        if arch.lower() in db_models:
            m = db_models[arch.lower()]
            result.append(ModelOut(
                id=m.id,
                name=m.name,
                version=m.version,
                accuracy=m.accuracy,
                latency_ms=m.latency_ms,
                size_mb=m.size_mb,
                is_default=m.is_default,
                description=m.description,
                status="available"
            ))
        else:
            result.append(ModelOut(
                id=None,
                name=arch,
                version="1.0.0",
                accuracy=None,
                latency_ms=None,
                size_mb=None,
                is_default=False,
                description="Not deployed yet",
                status="not_deployed"
            ))
    return result

@router.get("/models", response_model=List[ModelOut])
def get_registered_models(db: Session = Depends(get_db)):
    """Returns all 8 AI models with their deployment status (available / not_deployed)."""
    return get_all_models_status(db)

