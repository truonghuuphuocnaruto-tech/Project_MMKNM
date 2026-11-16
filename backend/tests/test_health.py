import pytest


@pytest.mark.anyio
async def test_health_live(client):
    response = await client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "live"}
    # Assert no sensitive environment or secret leakage
    assert "env" not in data
    assert "secret" not in data
    assert "path" not in data


@pytest.mark.anyio
async def test_health_ready(client):
    response = await client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["storage_writable"] is True
    # Assert no sensitive info leaked
    assert "quarantine_dir" not in data
    assert "config" not in data
