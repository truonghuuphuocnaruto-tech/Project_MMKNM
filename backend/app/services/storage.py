import hashlib
import os
import time
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.config import QUARANTINE_DIR, MAX_UPLOAD_SIZE_BYTES, STREAM_CHUNK_SIZE


class UploadTooLargeError(Exception):
    """Raised when an upload exceeds the maximum allowed size."""
    pass


class StorageSecurityError(Exception):
    """Raised when a storage path violates quarantine boundaries."""
    pass


def ensure_quarantine_dir() -> Path:
    """Ensure the quarantine directory exists and return its resolved path."""
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
    return QUARANTINE_DIR.resolve()


def is_storage_writable() -> bool:
    """Check if the quarantine directory is writable without leaking secrets."""
    try:
        q_dir = ensure_quarantine_dir()
        test_file = q_dir / f".health_probe_{uuid.uuid4().hex}.tmp"
        test_file.write_bytes(b"probe")
        if test_file.exists():
            test_file.unlink(missing_ok=True)
            return True
        return False
    except Exception:
        return False


def validate_quarantine_path(file_path: Path) -> Path:
    """Validate that the file path is strictly within the quarantine directory."""
    q_dir = ensure_quarantine_dir()
    resolved = file_path.resolve()
    try:
        resolved.relative_to(q_dir)
    except ValueError:
        raise StorageSecurityError("Path traversal detected: path is outside quarantine boundary.")
    return resolved


async def stream_upload_to_quarantine(
    file: UploadFile,
    max_size: int = MAX_UPLOAD_SIZE_BYTES,
) -> tuple[Path, str, int]:
    """
    Stream an uploaded file to an opaque quarantine path while calculating SHA-256.
    Enforces max_size chunk-by-chunk to prevent memory exhaustion (DoS).
    Cleans up immediately if the file exceeds max_size.
    """
    q_dir = ensure_quarantine_dir()
    opaque_filename = f"{uuid.uuid4().hex}.bin"
    target_path = validate_quarantine_path(q_dir / opaque_filename)

    hasher = hashlib.sha256()
    total_bytes = 0
    success = False

    try:
        with open(target_path, "wb") as dest:
            while True:
                chunk = await file.read(STREAM_CHUNK_SIZE)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_size:
                    raise UploadTooLargeError(
                        f"Tệp tải lên vượt quá giới hạn cho phép ({max_size // (1024 * 1024)}MB)."
                    )
                hasher.update(chunk)
                dest.write(chunk)
        success = True
    finally:
        # Guarantee partial file removal on failure, cancellation, timeout, or size violation
        if not success and target_path.exists():
            try:
                target_path.unlink(missing_ok=True)
            except OSError:
                pass

    return target_path, hasher.hexdigest(), total_bytes


def remove_quarantine_file(file_path: Path | str | None) -> bool:
    """Safely remove a file from quarantine if it exists."""
    if not file_path:
        return False
    try:
        path = validate_quarantine_path(Path(file_path))
        if path.exists() and path.is_file():
            path.unlink(missing_ok=True)
            return True
    except Exception:
        return False
    return False


def purge_expired_quarantine_files(ttl_seconds: int = 900) -> int:
    """
    Reaper: purge orphan files older than ttl_seconds in the quarantine folder.
    Returns count of files removed.
    """
    try:
        q_dir = ensure_quarantine_dir()
        now = time.time()
        purged = 0
        for entry in q_dir.iterdir():
            if entry.is_file() and not entry.name.startswith("."):
                try:
                    stat = entry.stat()
                    if ttl_seconds == 0 or (now - stat.st_mtime) >= ttl_seconds:
                        entry.unlink(missing_ok=True)
                        purged += 1
                except (OSError, PermissionError):
                    continue
        return purged
    except Exception:
        return 0
