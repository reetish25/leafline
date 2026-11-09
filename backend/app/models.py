from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False) # 'admin' or 'user'
    location = Column(String(255), nullable=True)
    location_consent = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    reviews_conducted = relationship("ReviewQueue", back_populates="reviewer")
    audit_logs = relationship("AuditLog", back_populates="user")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    overlay_image_path = Column(String(500), nullable=False)
    plant_label = Column(String(100), nullable=True, index=True) # e.g. "Plot A - North Field"
    location = Column(String(255), nullable=True, index=True)
    predicted_class = Column(String(50), nullable=False) # Immune, Resistant, MR, MS, S, HS
    confidence = Column(Float, nullable=False)
    severity_pct = Column(Float, nullable=False)
    healthy_pct = Column(Float, nullable=False)
    model_used = Column(String(100), nullable=False)
    forecast_days = Column(Integer, default=7, nullable=False)
    probabilities_json = Column(Text, nullable=True) # JSON dictionary of all class probabilities
    status = Column(String(50), default="approved", nullable=False) # approved, pending_review, escalated
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    @property
    def probabilities(self):
        if self.probabilities_json:
            try:
                import json
                return json.loads(self.probabilities_json)
            except Exception:
                return None
        return None

    # Relationships
    user = relationship("User", back_populates="scans")
    review_item = relationship("ReviewQueue", back_populates="scan", uselist=False, cascade="all, delete-orphan")


class PesticideEntry(Base):
    __tablename__ = "pesticide_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_group_id = Column(String(50), index=True, nullable=False) # links versions together
    severity_band = Column(String(50), nullable=False) # Immune/Resistant, MR/MS, S/HS
    active_ingredient = Column(String(255), nullable=False)
    dosage = Column(String(255), nullable=False)
    source = Column(String(500), nullable=False) # Ag extension citation
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)


class ReviewQueue(Base):
    __tablename__ = "review_queue"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(String(50), default="pending", nullable=False) # pending, approved, escalated
    trigger_reason = Column(String(255), nullable=True) # e.g. "Low confidence (62%)", "High severity (78%)"
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    scan = relationship("Scan", back_populates="review_item")
    reviewer = relationship("User", back_populates="reviews_conducted")


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    version = Column(String(50), nullable=False)
    accuracy = Column(Float, nullable=True) # e.g. 0.942, or null if not recorded
    latency_ms = Column(Integer, nullable=False) # e.g. 48
    size_mb = Column(Float, nullable=False) # e.g. 38.5
    is_default = Column(Boolean, default=False, nullable=False)
    description = Column(String(500), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
