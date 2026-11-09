"""
Leafline Isolated Inference Seam (Root convenience export)
See app/inference.py for full documentation and implementation contracts.
"""
from app.inference import (
    predict,
    estimate_severity,
    project_risk,
    SUNFLOWER_CLASSES,
)

__all__ = [
    "predict",
    "estimate_severity",
    "project_risk",
    "SUNFLOWER_CLASSES",
]
