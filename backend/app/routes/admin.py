import csv
import io
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import get_db
from app.models import User, Scan, Setting, ReviewQueue, ModelRegistry, PesticideEntry, AuditLog
from app.schemas import (
    UserOut, UserRoleUpdate, ScanOut,
    PesticideCreate, PesticideUpdate, PesticideOut,
    SettingOut, SettingUpdate,
    ReviewAction, ReviewQueueOut,
    ModelOut,
    RegionalSeverityItem,
    SystemStatusOut,
    AdminCreateUser,
    AdminCreateUserResponse,
    AuditLogOut,
)
from app.auth import get_current_admin, hash_password

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(get_current_admin)])

def log_audit(
    db: Session,
    admin: User,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None
):
    audit = AuditLog(
        user_id=admin.id,
        user_email=admin.email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)

# ------------------------------------------------------------------------------
# 1. USER MANAGEMENT
# ------------------------------------------------------------------------------
@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(desc(User.created_at)).all()

@router.post("/users", response_model=AdminCreateUserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_in: AdminCreateUser,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # If admin specified a password, use it; otherwise auto-generate a secure temporary password
    plain_password = user_in.password.strip() if user_in.password and len(user_in.password.strip()) >= 6 else secrets.token_urlsafe(10)

    new_user = User(
        name=user_in.name.strip() if user_in.name else None,
        email=user_in.email.lower().strip(),
        password_hash=hash_password(plain_password),
        role="user",
        location=user_in.location.strip() if user_in.location else None,
        location_consent=bool(user_in.location),
        is_active=True,
        must_change_password=True, # FORCED TO CHANGE PASSWORD ON FIRST LOGIN
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db,
        current_admin,
        action="USER_CREATED",
        entity_type="user",
        entity_id=str(new_user.id),
        details=f"Created user {new_user.email} (forced password change enabled)"
    )
    db.commit()

    return AdminCreateUserResponse(
        user=UserOut.model_validate(new_user),
        generated_password=plain_password
    )

@router.put("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    is_active: bool = Query(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deactivates or reactivates a user without deleting their account or scan history.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_admin.id and not is_active:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own active session.")

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    action_name = "USER_ACTIVATED" if is_active else "USER_DEACTIVATED"
    log_audit(
        db,
        current_admin,
        action=action_name,
        entity_type="user",
        entity_id=str(user.id),
        details=f"{action_name.replace('_', ' ').title()} account: {user.email}"
    )
    db.commit()

    return user

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role_in.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'.")
    
    old_role = user.role
    user.role = role_in.role
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        current_admin,
        action="USER_ROLE_CHANGED",
        entity_type="user",
        entity_id=str(user.id),
        details=f"Changed role of {user.email} from {old_role} to {role_in.role}"
    )
    db.commit()

    return user

# ------------------------------------------------------------------------------
# 2. ALL SUBMISSIONS / SCANS
# ------------------------------------------------------------------------------
@router.get("/scans", response_model=List[ScanOut])
def list_all_scans(
    user_id: Optional[int] = None,
    plant_label: Optional[str] = None,
    location: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Scan)
    if user_id:
        query = query.filter(Scan.user_id == user_id)
    if plant_label:
        query = query.filter(Scan.plant_label.ilike(f"%{plant_label}%"))
    if location:
        query = query.filter(Scan.location.ilike(f"%{location}%"))
    if status_filter:
        query = query.filter(Scan.status == status_filter)

    return query.order_by(desc(Scan.created_at)).all()

# ------------------------------------------------------------------------------
# 3. PESTICIDE & DOSAGE TABLE (VERSIONED CRUD)
# ------------------------------------------------------------------------------
@router.get("/pesticide-table", response_model=List[PesticideOut])
def get_pesticide_entries(include_archived: bool = False, db: Session = Depends(get_db)):
    query = db.query(PesticideEntry)
    if not include_archived:
        query = query.filter(PesticideEntry.is_active == True)
    return query.order_by(PesticideEntry.severity_band, desc(PesticideEntry.version)).all()

@router.post("/pesticide-table", response_model=PesticideOut, status_code=status.HTTP_201_CREATED)
def create_pesticide_entry(
    entry_in: PesticideCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    group_id = f"pest_{uuid.uuid4().hex[:8]}"
    entry = PesticideEntry(
        entry_group_id=group_id,
        severity_band=entry_in.severity_band,
        active_ingredient=entry_in.active_ingredient,
        dosage=entry_in.dosage,
        source=entry_in.source,
        version=1,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    log_audit(
        db,
        current_admin,
        action="PESTICIDE_CREATED",
        entity_type="pesticide",
        entity_id=str(entry.id),
        details=f"Created {entry.active_ingredient} (Band: {entry.severity_band})"
    )
    db.commit()

    return entry

@router.put("/pesticide-table/{entry_id}", response_model=PesticideOut)
def update_pesticide_entry(
    entry_id: int,
    entry_in: PesticideUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(PesticideEntry).filter(PesticideEntry.id == entry_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Pesticide entry not found")

    existing.is_active = False

    new_version = PesticideEntry(
        entry_group_id=existing.entry_group_id,
        severity_band=entry_in.severity_band,
        active_ingredient=entry_in.active_ingredient,
        dosage=entry_in.dosage,
        source=entry_in.source,
        version=existing.version + 1,
        is_active=True,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    log_audit(
        db,
        current_admin,
        action="PESTICIDE_UPDATED",
        entity_type="pesticide",
        entity_id=str(new_version.id),
        details=f"Updated {existing.active_ingredient} from v{existing.version} to v{new_version.version}"
    )
    db.commit()

    return new_version

# ------------------------------------------------------------------------------
# 4. REVIEW QUEUE
# ------------------------------------------------------------------------------
@router.get("/review-queue", response_model=List[ReviewQueueOut])
def get_review_queue(queue_status: Optional[str] = "pending", db: Session = Depends(get_db)):
    query = db.query(ReviewQueue)
    if queue_status and queue_status != "all":
        query = query.filter(ReviewQueue.status == queue_status)
    items = query.order_by(desc(ReviewQueue.created_at)).all()

    results = []
    for item in items:
        reviewer_email = item.reviewer.email if item.reviewer else None
        item_out = ReviewQueueOut(
            id=item.id,
            scan_id=item.scan_id,
            status=item.status,
            trigger_reason=item.trigger_reason,
            reviewed_by=item.reviewed_by,
            reviewer_email=reviewer_email,
            reviewed_at=item.reviewed_at,
            notes=item.notes,
            created_at=item.created_at,
            scan=ScanOut.model_validate(item.scan)
        )
        results.append(item_out)
    return results

@router.post("/review-queue/{queue_id}/action", response_model=ReviewQueueOut)
def review_action(
    queue_id: int,
    action_in: ReviewAction,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    action = action_in.action.lower()
    if action not in ["approve", "escalate"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'escalate'")

    item = db.query(ReviewQueue).filter(ReviewQueue.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    new_status = "approved" if action == "approve" else "escalated"
    item.status = new_status
    item.reviewed_by = current_admin.id
    item.reviewed_at = datetime.now(timezone.utc)
    item.notes = action_in.notes

    if item.scan:
        item.scan.status = new_status

    db.commit()
    db.refresh(item)

    log_audit(
        db,
        current_admin,
        action="REVIEW_TRIAGED",
        entity_type="review",
        entity_id=str(item.id),
        details=f"Triaged queue #{item.id} (Scan #{item.scan_id}) as {new_status}"
    )
    db.commit()

    return ReviewQueueOut(
        id=item.id,
        scan_id=item.scan_id,
        status=item.status,
        trigger_reason=item.trigger_reason,
        reviewed_by=item.reviewed_by,
        reviewer_email=current_admin.email,
        reviewed_at=item.reviewed_at,
        notes=item.notes,
        created_at=item.created_at,
        scan=ScanOut.model_validate(item.scan)
    )

# ------------------------------------------------------------------------------
# 5. MODEL REGISTRY
# ------------------------------------------------------------------------------
@router.get("/models", response_model=List[ModelOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(ModelRegistry).order_by(desc(ModelRegistry.is_default), ModelRegistry.name).all()

@router.post("/models/{model_id}/set-default", response_model=List[ModelOut])
def set_default_model(
    model_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    target = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model not found")

    db.query(ModelRegistry).update({ModelRegistry.is_default: False})
    target.is_default = True
    db.commit()

    log_audit(
        db,
        current_admin,
        action="MODEL_SET_DEFAULT",
        entity_type="model",
        entity_id=str(target.id),
        details=f"Set default model to {target.name}"
    )
    db.commit()

    return db.query(ModelRegistry).order_by(desc(ModelRegistry.is_default), ModelRegistry.name).all()

# ------------------------------------------------------------------------------
# 6. CONFIGURATION CONTROLS / SETTINGS
# ------------------------------------------------------------------------------
@router.get("/settings", response_model=Dict[str, str])
def get_all_settings(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    return {s.key: s.value for s in settings}

@router.put("/settings", response_model=Dict[str, str])
def update_settings(
    updates: Dict[str, str],
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    for key, value in updates.items():
        s = db.query(Setting).filter(Setting.key == key).first()
        if s:
            s.value = str(value)
        else:
            db.add(Setting(key=key, value=str(value), description=""))
    db.commit()

    log_audit(
        db,
        current_admin,
        action="SETTINGS_UPDATED",
        entity_type="setting",
        details=f"Updated keys: {', '.join(updates.keys())}"
    )
    db.commit()

    all_settings = db.query(Setting).all()
    return {s.key: s.value for s in all_settings}

# ------------------------------------------------------------------------------
# 7. REGIONAL SEVERITY INTELLIGENCE (PLAIN TABLE)
# ------------------------------------------------------------------------------
@router.get("/regional-severity", response_model=List[RegionalSeverityItem])
def get_regional_severity(db: Session = Depends(get_db)):
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_scans = db.query(Scan).filter(Scan.created_at >= one_week_ago).all()

    region_map: Dict[str, Dict[str, Any]] = {}
    for s in recent_scans:
        loc = s.location or "Unspecified Location"
        if loc not in region_map:
            region_map[loc] = {
                "severities": [],
                "classes": [],
            }
        region_map[loc]["severities"].append(s.severity_pct)
        region_map[loc]["classes"].append(s.predicted_class)

    items: List[RegionalSeverityItem] = []
    for loc, data in region_map.items():
        worst = max(data["severities"]) if data["severities"] else 0.0
        count = len(data["severities"])

        class_counts = {}
        for c in data["classes"]:
            class_counts[c] = class_counts.get(c, 0) + 1
        top_condition = max(class_counts, key=class_counts.get) if class_counts else "Unknown"

        if worst > 60.0:
            trend = "up"
        elif worst < 20.0:
            trend = "down"
        else:
            trend = "stable"

        items.append(RegionalSeverityItem(
            location=loc,
            worst_severity=round(worst, 1),
            report_count=count,
            trend=trend,
            primary_condition=top_condition
        ))

    items.sort(key=lambda x: x.worst_severity, reverse=True)
    return items

# ------------------------------------------------------------------------------
# 8. SYSTEM STATUS STRIP
# ------------------------------------------------------------------------------
@router.get("/system-status", response_model=SystemStatusOut)
def get_system_status(db: Session = Depends(get_db)):
    default_model = db.query(ModelRegistry).filter(ModelRegistry.is_default == True).first()
    active_model_name = default_model.name if default_model else "MobileNetV2"

    pending_count = db.query(ReviewQueue).filter(ReviewQueue.status == "pending").count()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    scans_today = db.query(Scan).filter(Scan.created_at >= today_start).count()

    return SystemStatusOut(
        climate_api_status="healthy",
        climate_api_latency_ms=42,
        inference_service_status="healthy",
        inference_service_latency_ms=18,
        active_model=active_model_name,
        pending_reviews=pending_count,
        total_scans_today=scans_today
    )

# ------------------------------------------------------------------------------
# 9. AUDIT LOG (NEW ADMIN FEATURE)
# ------------------------------------------------------------------------------
@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(desc(AuditLog.created_at)).limit(limit).all()

# ------------------------------------------------------------------------------
# 10. CSV EXPORT (NEW ADMIN FEATURE)
# ------------------------------------------------------------------------------
@router.get("/export/scans")
def export_scans_csv(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(desc(Scan.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Scan ID", "User ID", "Created At", "Plant / Field Label", "Location",
        "Predicted Class", "Confidence", "Severity %", "Healthy %", "Model Used",
        "Forecast Days", "Status"
    ])
    for s in scans:
        writer.writerow([
            s.id, s.user_id, s.created_at.isoformat() if s.created_at else "",
            s.plant_label or "Unlabeled", s.location or "Not recorded",
            s.predicted_class, f"{s.confidence:.4f}", f"{s.severity_pct:.1f}",
            f"{s.healthy_pct:.1f}", s.model_used, s.forecast_days, s.status
        ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leafline_scans_export.csv"}
    )

@router.get("/export/users")
def export_users_csv(db: Session = Depends(get_db)):
    users = db.query(User).order_by(desc(User.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "User ID", "Name", "Email", "Role", "Location", "Location Consent",
        "Status", "Must Change Password", "Created At"
    ])
    for u in users:
        writer.writerow([
            u.id, u.name or "", u.email, u.role, u.location or "",
            "Yes" if u.location_consent else "No",
            "Active" if u.is_active else "Inactive",
            "Yes" if u.must_change_password else "No",
            u.created_at.isoformat() if u.created_at else ""
        ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leafline_users_export.csv"}
    )

@router.get("/export/pesticides")
def export_pesticides_csv(include_archived: bool = True, db: Session = Depends(get_db)):
    query = db.query(PesticideEntry)
    if not include_archived:
        query = query.filter(PesticideEntry.is_active == True)
    entries = query.order_by(PesticideEntry.severity_band, desc(PesticideEntry.version)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Entry Group ID", "Severity Band", "Active Ingredient", "Dosage Rate",
        "Source Citation", "Version", "Status", "Updated At"
    ])
    for p in entries:
        writer.writerow([
            p.id, p.entry_group_id, p.severity_band, p.active_ingredient,
            p.dosage, p.source, f"v{p.version}",
            "Active" if p.is_active else "Archived",
            p.updated_at.isoformat() if p.updated_at else ""
        ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leafline_pesticides_export.csv"}
    )
