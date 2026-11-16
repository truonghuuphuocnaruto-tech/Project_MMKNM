import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
QUARANTINE_DIR = Path(os.getenv("QUARANTINE_DIR", str(BASE_DIR / "quarantine"))).resolve()

# Upload limits & ASGI early enforcement
MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(15 * 1024 * 1024)))  # 15 MB
STREAM_CHUNK_SIZE: int = 64 * 1024  # 64 KB
MULTIPART_OVERHEAD_BYTES: int = int(os.getenv("MULTIPART_OVERHEAD_BYTES", str(128 * 1024)))  # 128 KB overhead
MAX_REQUEST_BODY_BYTES: int = MAX_UPLOAD_SIZE_BYTES + MULTIPART_OVERHEAD_BYTES  # 15,859,712 bytes

# Concurrency & Timeout controls
MAX_CONCURRENT_UPLOADS: int = int(os.getenv("MAX_CONCURRENT_UPLOADS", "3"))
UPLOAD_TIMEOUT_SECONDS: float = float(os.getenv("UPLOAD_TIMEOUT_SECONDS", "60.0"))

# Allowed mime types & extensions
ALLOWED_MIME_TYPES: set[str] = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "video/mp4",
    "video/webm",
}

ALLOWED_EXTENSIONS: set[str] = {
    ".mp3",
    ".wav",
    ".ogg",
    ".mp4",
    ".webm",
}

# Retention & Reaper
CLEANUP_TTL_SECONDS: int = int(os.getenv("CLEANUP_TTL_SECONDS", "900"))  # 15 minutes

# CORS Origins
cors_env = os.getenv("CORS_ORIGINS")
if cors_env:
    CORS_ORIGINS: list[str] = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
else:
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
