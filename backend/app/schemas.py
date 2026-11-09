from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int = 0
    name: Optional[str] = None
    email: EmailStr
    role: str
    location: Optional[str] = None
    location_consent: bool
    is_active: bool = True
    must_change_password: bool = False
    created_at: datetime

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    location_consent: bool

class UserRoleUpdate(BaseModel):
    role: str

class AdminCreateUser(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    location: Optional[str] = None
    password: Optional[str] = None

class AdminCreateUserResponse(BaseModel):
    user: UserOut
    generated_password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

# Scan schemas
class ScanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    image_path: str
    overlay_image_path: str
    plant_label: Optional[str] = None
    location: Optional[str] = None
    predicted_class: str
    confidence: float
    severity_pct: float
    healthy_pct: float
    model_used: str
    forecast_days: int
    probabilities: Optional[Dict[str, float]] = None
    status: str
    created_at: datetime

class DayOutlook(BaseModel):
    day_offset: int
    date: str
    risk_score: float
    risk_level: str
    projected_severity: float
    temperature_c: float
    relative_humidity_pct: float
    favorable_conditions: str

class RecommendationOut(BaseModel):
    severity_band: str
    active_ingredient: str
    dosage: str
    source: str
    disclaimer: str

class ScanDetailOut(BaseModel):
    scan: ScanOut
    risk_projection: List[DayOutlook]
    recommendation: Optional[RecommendationOut] = None
    trend_note: Optional[str] = None # comparison to user's last scan for this plant_label

# Pesticide schemas
class PesticideCreate(BaseModel):
    severity_band: str # "Immune/Resistant", "MR/MS", "S/HS"
    active_ingredient: str
    dosage: str
    source: str

class PesticideUpdate(BaseModel):
    severity_band: str
    active_ingredient: str
    dosage: str
    source: str

class PesticideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entry_group_id: str
    severity_band: str
    active_ingredient: str
    dosage: str
    source: str
    version: int
    is_active: bool
    updated_at: datetime

# Settings schemas
class SettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    key: str
    value: str
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: str

# Review Queue schemas
class ReviewAction(BaseModel):
    action: str = Field(description="'approve' or 'escalate'")
    notes: Optional[str] = None

class ReviewQueueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    scan_id: int
    status: str
    trigger_reason: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewer_email: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    scan: ScanOut

# Model Registry schemas
class ModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[int] = None
    name: str
    version: Optional[str] = "1.0.0"
    accuracy: Optional[float] = None
    latency_ms: Optional[int] = None
    size_mb: Optional[float] = None
    is_default: bool = False
    description: Optional[str] = None
    status: str = "available"  # "available" or "not_deployed"

# Regional severity
class RegionalSeverityItem(BaseModel):
    location: str
    worst_severity: float
    report_count: int
    trend: str # "up", "down", "stable"
    primary_condition: str

# System status
class SystemStatusOut(BaseModel):
    climate_api_status: str # "healthy", "degraded", "offline"
    climate_api_latency_ms: int
    inference_service_status: str # "healthy", "degraded", "offline"
    inference_service_latency_ms: int
    active_model: str
    pending_reviews: int
    total_scans_today: int

# Audit Log
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    user_email: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
