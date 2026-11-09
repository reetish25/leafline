import io
import pytest
from PIL import Image
from app.inference import predict, estimate_severity, project_risk, SUNFLOWER_CLASSES

def make_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new("RGB", (224, 224), (55, 125, 45))
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_inference_predict_contract():
    """Verify that predict adheres to the exact contract."""
    sample_bytes = make_test_image_bytes()

    result = predict(sample_bytes, model_name="MobileNetV2")

    assert "class_name" in result
    assert result["class_name"] in SUNFLOWER_CLASSES
    assert "confidence" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert "probabilities" in result

    # Probabilities should cover all classes
    for c in SUNFLOWER_CLASSES:
        assert c in result["probabilities"]

def test_inference_stability():
    """Verify that model inference is deterministic for identical image bytes."""
    sample_bytes = make_test_image_bytes()

    res1 = predict(sample_bytes)
    res2 = predict(sample_bytes)

    assert res1["class_name"] == res2["class_name"]
    assert res1["confidence"] == res2["confidence"]

def test_severity_segmentation_contract():
    """Verify severity estimation returns percentages and visual overlay bytes."""
    sample_bytes = make_test_image_bytes()

    result = estimate_severity(sample_bytes, class_name="MS")

    assert "healthy_pct" in result
    assert "diseased_pct" in result
    assert "overlay_image_bytes" in result
    assert round(result["healthy_pct"] + result["diseased_pct"], 1) == 100.0
    assert len(result["overlay_image_bytes"]) > 100

def test_project_risk_contract():
    """Verify 15-day risk projection structure."""
    days = 10
    projections = project_risk(location="Salina, KS", days=days, current_severity=30.0)

    assert len(projections) == days
    for day in projections:
        assert "day_offset" in day
        assert "date" in day
        assert "risk_score" in day
        assert "risk_level" in day
        assert day["risk_level"] in ["Low", "Moderate", "High", "Severe"]
        assert "projected_severity" in day
        assert "temperature_c" in day
        assert "relative_humidity_pct" in day
        assert "favorable_conditions" in day
