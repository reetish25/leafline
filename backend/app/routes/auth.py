import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserLogin,
    Token,
    UserOut,
    UserProfileUpdate,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# NOTE: Public registration has been completely removed.
# User accounts can only be provisioned by an Admin via the Admin Console.

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Look up user by lowercase email
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    
    # Generic error message: never reveal whether the email exists or password was wrong
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise generic_error

    if not user.is_active:
        raise generic_error

    if not verify_password(credentials.password, user.password_hash):
        raise generic_error

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    generated_token = None

    if user and user.is_active:
        generated_token = secrets.token_urlsafe(32)
        user.reset_token = generated_token
        # Expire in 1 hour
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

    # Always return a generic success response to prevent user enumeration
    return ForgotPasswordResponse(
        message="If an account with that email exists, a password reset link has been dispatched.",
        reset_token=generated_token # included so the UI / simulation can easily complete the reset
    )

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    user = db.query(User).filter(User.reset_token == req.token.strip()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    # Check expiration
    if user.reset_token_expires:
        # SQLite stores naive datetimes, compare safely
        expires = user.reset_token_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired. Please request a new one."
            )

    user.password_hash = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.must_change_password = False
    db.commit()

    return {"message": "Password has been successfully updated. You may now sign in."}

@router.post("/change-password", response_model=UserOut)
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.password_hash = hash_password(req.new_password)
    current_user.must_change_password = False
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not profile_in.location_consent and profile_in.location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit consent is required to store location data."
        )

    if profile_in.name is not None:
        current_user.name = profile_in.name.strip()
    current_user.location_consent = profile_in.location_consent
    current_user.location = profile_in.location.strip() if profile_in.location_consent and profile_in.location else None
    db.commit()
    db.refresh(current_user)
    return current_user
