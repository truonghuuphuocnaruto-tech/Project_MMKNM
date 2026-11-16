import threading
import time
from typing import Any

from app.config import CLEANUP_TTL_SECONDS
from app.services.storage import remove_quarantine_file


class InMemoryAnalysisStore:
    """Thread-safe store for analysis results and file references."""

    def __init__(self):
        self._store: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def save(self, analysis_id: str, data: dict[str, Any]) -> None:
        with self._lock:
            # Attach a timestamp for TTL checks
            data["_created_ts"] = time.time()
            self._store[analysis_id] = data

    def get(self, analysis_id: str) -> dict[str, Any] | None:
        with self._lock:
            data = self._store.get(analysis_id)
            if not data:
                return None
            # Return a copy without internal metadata
            result = dict(data)
            result.pop("_created_ts", None)
            result.pop("_quarantine_path", None)
            return result

    def delete(self, analysis_id: str) -> bool:
        with self._lock:
            data = self._store.pop(analysis_id, None)
            if not data:
                return False
            # Clean up quarantine file if path was recorded
            quarantine_path = data.get("_quarantine_path")
            if quarantine_path:
                remove_quarantine_file(quarantine_path)
            return True

    def purge_expired(self, ttl_seconds: int = CLEANUP_TTL_SECONDS) -> int:
        now = time.time()
        expired_ids = []
        with self._lock:
            for aid, entry in list(self._store.items()):
                created_ts = entry.get("_created_ts", 0)
                if (now - created_ts) > ttl_seconds:
                    expired_ids.append(aid)

            for aid in expired_ids:
                data = self._store.pop(aid, None)
                if data:
                    quarantine_path = data.get("_quarantine_path")
                    if quarantine_path:
                        remove_quarantine_file(quarantine_path)

        return len(expired_ids)

    def count(self) -> int:
        with self._lock:
            return len(self._store)


# Global singleton instance
store = InMemoryAnalysisStore()
