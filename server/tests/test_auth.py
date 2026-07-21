def test_register_creates_user_and_returns_token(api_client):
    response = api_client.post(
        "/auth/register", json={"email": "new@example.com", "password": "password1"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_rejects_password_without_digit(api_client):
    response = api_client.post(
        "/auth/register", json={"email": "new@example.com", "password": "nodigitshere"}
    )

    assert response.status_code == 400
    assert "number" in response.json()["detail"]


def test_register_rejects_password_without_letter(api_client):
    response = api_client.post(
        "/auth/register", json={"email": "new@example.com", "password": "12345678"}
    )

    assert response.status_code == 400
    assert "letter" in response.json()["detail"]


def test_register_rejects_duplicate_email(api_client):
    payload = {"email": "dupe@example.com", "password": "password1"}
    first = api_client.post("/auth/register", json=payload)
    second = api_client.post("/auth/register", json=payload)

    assert first.status_code == 200
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"]


def test_login_succeeds_with_correct_credentials(api_client):
    payload = {"email": "user@example.com", "password": "password1"}
    api_client.post("/auth/register", json=payload)

    response = api_client.post("/auth/login", json=payload)

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_rejects_wrong_password(api_client):
    api_client.post(
        "/auth/register", json={"email": "user2@example.com", "password": "password1"}
    )

    response = api_client.post(
        "/auth/login", json={"email": "user2@example.com", "password": "wrongpass1"}
    )

    assert response.status_code == 401


def test_login_rejects_unknown_email(api_client):
    response = api_client.post(
        "/auth/login", json={"email": "ghost@example.com", "password": "password1"}
    )

    assert response.status_code == 401


def test_me_requires_valid_token(api_client):
    response = api_client.get("/auth/me")
    assert response.status_code == 401

    response = api_client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_me_returns_current_user_for_valid_token(api_client):
    payload = {"email": "me@example.com", "password": "password1"}
    register_response = api_client.post("/auth/register", json=payload)
    token = register_response.json()["access_token"]

    response = api_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "me@example.com"
