import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException as FastAPIHTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import BASE_DIR, CORS_ORIGINS, CLEANUP_TTL_SECONDS
from app.middleware import UploadHardeningMiddleware, PayloadTooLargeError
from app.routers import analyses, health
from app.services.analysis_store import store
from app.services.storage import ensure_quarantine_dir, purge_expired_quarantine_files

# Configure minimal, safe logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scam_checker_api")


async def periodic_reaper():
    """Background task to regularly purge expired files and analysis records."""
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            files_purged = purge_expired_quarantine_files(CLEANUP_TTL_SECONDS)
            records_purged = store.purge_expired(CLEANUP_TTL_SECONDS)
            if files_purged or records_purged:
                logger.info("Reaper purged %d expired files and %d analysis records", files_purged, records_purged)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.warning("Reaper cycle encountered an error: %s", type(exc).__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directory and initial sweep (purge leftovers from previous crash)
    ensure_quarantine_dir()
    purge_expired_quarantine_files(0)
    store.purge_expired(CLEANUP_TTL_SECONDS)

    reaper_task = asyncio.create_task(periodic_reaper())
    logger.info("Scam Checker API v1 started successfully.")
    yield

    # Shutdown: cancel reaper and sweep
    reaper_task.cancel()
    try:
        await reaper_task
    except asyncio.CancelledError:
        pass
    purge_expired_quarantine_files(0)  # Wipe all temporary files on graceful shutdown
    logger.info("Scam Checker API v1 shut down cleanly.")


app = FastAPI(
    title="AI Voice & Video Scam Checker API",
    description="Backend API v1 for media analysis, forensic facts verification, and educational fraud awareness.",
    version="0.1.0",
    lifespan=lifespan,
)

# Concurrency & Request Body Guard ASGI Middleware (innermost to preserve CORS wrapping)
app.add_middleware(UploadHardeningMiddleware)

# CORS Configuration for local frontend development (strictly narrowed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


@app.exception_handler(PayloadTooLargeError)
async def payload_too_large_handler(request: Request, exc: PayloadTooLargeError):
    return JSONResponse(
        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
        content={"detail": "Tệp tải lên vượt quá giới hạn cho phép (15MB)."},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Normalize validation errors to safe Vietnamese message without exposing internal schema."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "Dữ liệu yêu cầu không hợp lệ."},
    )


@app.exception_handler(FastAPIHTTPException)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


# Global safe exception handler to prevent leaking internal stack traces or paths
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Đã xảy ra lỗi nội bộ máy chủ. Vui lòng thử lại sau."},
    )


# Mount routers
app.include_router(health.router)
app.include_router(analyses.router)

# Mount frontend static build assets if available
FRONTEND_DIST = (BASE_DIR.parent / "frontend" / "dist").resolve()
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")


@app.get("/", tags=["Root"])
async def root(request: Request):
    index_file = FRONTEND_DIST / "index.html"
    if "text/html" in request.headers.get("accept", "") and index_file.is_file():
        return FileResponse(index_file)

    return {
        "service": "AI Voice & Video Scam Checker API",
        "version": "0.1.0",
        "mode": "demo",
        "docs_url": "/docs",
    }


@app.get("/app", include_in_schema=False)
async def app_view():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Frontend chưa được build. Vui lòng chạy 'npm run build' trong thư mục frontend/."},
    )
