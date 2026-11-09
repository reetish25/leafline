import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

def make_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new("RGB", (224, 224), (55, 125, 45))
    img.save(buf, format="JPEG")
    return buf.getvalue()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_login_flow():
    # Login as grower
    res = client.post("/api/auth/login", json={
        "email": "grower@sunfield.farm",
        "password": "GrowerPass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "user"

    # Login as admin
    res_admin = client.post("/api/auth/login", json={
        "email": "admin@leafline.ag",
        "password": "AdminPass123!"
    })
    assert res_admin.status_code == 200
    assert res_admin.json()["user"]["role"] == "admin"

def test_generic_login_errors():
    # Test non-existent email
    res1 = client.post("/api/auth/login", json={
        "email": "ghost_unknown_farmer@nowhere.ag",
        "password": "WrongPassword123!"
    })
    assert res1.status_code == 401
    assert res1.json()["detail"] == "Invalid email or password"

    # Test existing email with wrong password
    res2 = client.post("/api/auth/login", json={
        "email": "grower@sunfield.farm",
        "password": "IncorrectPassword999!"
    })
    assert res2.status_code == 401
    assert res2.json()["detail"] == "Invalid email or password"

def test_scan_submission_and_flow():
    login_res = client.post("/api/auth/login", json={
        "email": "grower@sunfield.farm",
        "password": "GrowerPass123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    leaf_bytes = make_test_image_bytes()

    files = {"image": ("test_sunflower.jpg", leaf_bytes, "image/jpeg")}
    data = {
        "plant_label": "Plot A - North Field",
        "forecast_days": "7",
        "location": "Salina, KS"
    }

    res = client.post("/api/scans", files=files, data=data, headers=headers)
    assert res.status_code == 201
    scan_data = res.json()
    assert "scan" in scan_data
    assert scan_data["scan"]["predicted_class"] in ["Immune", "Resistant", "MR", "MS", "S", "HS"]
    assert scan_data["scan"]["image_path"].startswith("/uploads/")
    assert scan_data["scan"]["overlay_image_path"].startswith("/uploads/")
    assert len(scan_data["risk_projection"]) <= 7
    assert scan_data["recommendation"] is not None

def test_versioned_pesticide_table():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@leafline.ag",
        "password": "AdminPass123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_res = client.get("/api/admin/pesticide-table", headers=headers)
    assert get_res.status_code == 200
    entries = get_res.json()
    assert len(entries) > 0

    first_entry = entries[0]
    initial_version = first_entry["version"]
    group_id = first_entry["entry_group_id"]

    update_res = client.put(f"/api/admin/pesticide-table/{first_entry['id']}", json={
        "severity_band": first_entry["severity_band"],
        "active_ingredient": first_entry["active_ingredient"] + " (Revised dosage guideline)",
        "dosage": "5.0 - 10.0 fl oz / acre",
        "source": "2026 Updated Agri-Extension Notice"
    }, headers=headers)

    assert update_res.status_code == 200
    new_entry = update_res.json()
    assert new_entry["version"] == initial_version + 1
    assert new_entry["entry_group_id"] == group_id
    assert new_entry["is_active"] is True

    all_res = client.get("/api/admin/pesticide-table?include_archived=true", headers=headers)
    all_entries = all_res.json()
    group_versions = [e for e in all_entries if e["entry_group_id"] == group_id]
    assert len(group_versions) >= 2
    prev_versions = [e for e in group_versions if e["version"] == initial_version]
    assert len(prev_versions) == 1
    assert prev_versions[0]["is_active"] is False

def test_admin_user_provisioning_and_forced_password_change():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@leafline.ag",
        "password": "AdminPass123!"
    })
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    test_email = "new_field_operator@sunfield.farm"
    create_res = client.post("/api/admin/users", json={
        "name": "Alex Mercer",
        "email": test_email,
        "location": "Barton County, KS"
    }, headers=admin_headers)

    # If user already exists from a prior test run, handle gracefully
    if create_res.status_code == 400:
        pass
    else:
        assert create_res.status_code == 201
        created_data = create_res.json()
        assert created_data["user"]["must_change_password"] is True
        temp_pass = created_data["generated_password"]
        assert temp_pass is not None

        # Sign in with temporary password
        new_user_login = client.post("/api/auth/login", json={
            "email": test_email,
            "password": temp_pass
        })
        assert new_user_login.status_code == 200
        new_token = new_user_login.json()["access_token"]
        assert new_user_login.json()["user"]["must_change_password"] is True

        # Forced password change flow
        change_res = client.post("/api/auth/change-password", json={
            "current_password": temp_pass,
            "new_password": "NewPermanentPass123!"
        }, headers={"Authorization": f"Bearer {new_token}"})
        assert change_res.status_code == 200
        assert change_res.json()["must_change_password"] is False

def test_deactivate_instead_of_delete():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@leafline.ag",
        "password": "AdminPass123!"
    })
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch users
    users_res = client.get("/api/admin/users", headers=admin_headers)
    grower = next(u for u in users_res.json() if u["email"] == "agri_dakota@prairie.org")

    # Deactivate grower
    deact_res = client.put(f"/api/admin/users/{grower['id']}/status?is_active=false", headers=admin_headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # Attempt login as deactivated grower: must fail with generic error
    fail_login = client.post("/api/auth/login", json={
        "email": "agri_dakota@prairie.org",
        "password": "PrairiePass123!"
    })
    assert fail_login.status_code == 401
    assert fail_login.json()["detail"] == "Invalid email or password"

    # Reactivate grower
    react_res = client.put(f"/api/admin/users/{grower['id']}/status?is_active=true", headers=admin_headers)
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True

def test_forgot_and_reset_password_flow():
    # 1. Request reset
    req_res = client.post("/api/auth/forgot-password", json={
        "email": "grower@sunfield.farm"
    })
    assert req_res.status_code == 200
    token = req_res.json()["reset_token"]
    assert token is not None

    # 2. Reset with token
    reset_res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "ResetPass987!"
    })
    assert reset_res.status_code == 200

    # 3. Login with new password
    login_new = client.post("/api/auth/login", json={
        "email": "grower@sunfield.farm",
        "password": "ResetPass987!"
    })
    assert login_new.status_code == 200

    # Restore original demo password
    auth_token = login_new.json()["access_token"]
    client.post("/api/auth/change-password", json={
        "current_password": "ResetPass987!",
        "new_password": "GrowerPass123!"
    }, headers={"Authorization": f"Bearer {auth_token}"})

def test_audit_logs_and_csv_exports():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@leafline.ag",
        "password": "AdminPass123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Audit logs
    audit_res = client.get("/api/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)

    # Scans CSV
    scans_csv = client.get("/api/admin/export/scans", headers=headers)
    assert scans_csv.status_code == 200
    assert "Scan ID" in scans_csv.text

    # Users CSV
    users_csv = client.get("/api/admin/export/users", headers=headers)
    assert users_csv.status_code == 200
    assert "User ID" in users_csv.text

    # Pesticides CSV
    pest_csv = client.get("/api/admin/export/pesticides", headers=headers)
    assert pest_csv.status_code == 200
    assert "Active Ingredient" in pest_csv.text
