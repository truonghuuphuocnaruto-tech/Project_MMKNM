from fastapi import APIRouter, status, Response

from app.schemas import HealthLiveResponse, HealthReadyResponse
from app.services.storage import is_storage_writable

router = APIRouter(tags=["Health"])


@router.get("/health/live", response_model=HealthLiveResponse, status_code=status.HTTP_200_OK)
async def health_live():
    """Liveness probe: verifies that the server process is responsive."""
    return HealthLiveResponse(status="live")


@router.get("/health/ready", response_model=HealthReadyResponse, status_code=status.HTTP_200_OK)
async def health_ready(response: Response):
    """Readiness probe: verifies that temporary quarantine storage is writable."""
    writable = is_storage_writable()
    if not writable:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthReadyResponse(status="ready", storage_writable=False)
    return HealthReadyResponse(status="ready", storage_writable=True)
