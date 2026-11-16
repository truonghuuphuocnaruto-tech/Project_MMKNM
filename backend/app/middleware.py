import asyncio
import json
import logging
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import (
    MAX_CONCURRENT_UPLOADS,
    MAX_REQUEST_BODY_BYTES,
    UPLOAD_TIMEOUT_SECONDS,
)

logger = logging.getLogger("scam_checker_api.upload_guard")


class PayloadTooLargeError(StarletteHTTPException):
    """Raised when streaming upload request payload exceeds allowed byte threshold."""

    def __init__(self, detail: str = "Tệp tải lên vượt quá giới hạn cho phép (15MB)."):
        super().__init__(status_code=413, detail=detail)


class ConcurrencyLimiter:
    """Coroutine-safe concurrency limiter with non-blocking try_acquire."""

    def __init__(self, max_concurrent: int):
        self.max_concurrent = max_concurrent
        self.active_count = 0
        self._lock: asyncio.Lock | None = None

    def _get_lock(self) -> asyncio.Lock:
        loop = asyncio.get_running_loop()
        if self._lock is None or getattr(self._lock, "_loop", None) is not loop:
            self._lock = asyncio.Lock()
        return self._lock

    async def try_acquire(self) -> bool:
        lock = self._get_lock()
        async with lock:
            if self.active_count >= self.max_concurrent:
                return False
            self.active_count += 1
            return True

    async def release(self) -> None:
        lock = self._get_lock()
        async with lock:
            self.active_count = max(0, self.active_count - 1)


default_limiter = ConcurrencyLimiter(MAX_CONCURRENT_UPLOADS)


class UploadHardeningMiddleware:
    """
    ASGI-level defense middleware that intercepts uploads BEFORE multipart parsing:
    1. Intercepts POST /api/v1/analyses requests.
    2. Rejects requests exceeding concurrency capacity with 429 Too Many Requests (Retry-After: 5).
    3. Rejects requests with Content-Length > MAX_REQUEST_BODY_BYTES with 413 immediately.
    4. Streams & monitors chunked/body bytes to reject with 413 if stream exceeds cap.
    5. Enforces strict upload timeout with 504 Gateway Timeout.
    """

    def __init__(
        self,
        app,
        max_request_bytes: int | None = None,
        max_concurrent: int | None = None,
        timeout_seconds: float | None = None,
    ):
        self.app = app
        self._max_request_bytes = max_request_bytes
        self._timeout_seconds = timeout_seconds
        if max_concurrent is not None:
            self.limiter = ConcurrencyLimiter(max_concurrent)
        else:
            self.limiter = default_limiter

    @property
    def max_allowed_bytes(self) -> int:
        if self._max_request_bytes is not None:
            return self._max_request_bytes
        import app.config as config
        return config.MAX_REQUEST_BODY_BYTES

    @property
    def current_timeout(self) -> float:
        if self._timeout_seconds is not None:
            return self._timeout_seconds
        import app.config as config
        return config.UPLOAD_TIMEOUT_SECONDS

    @staticmethod
    async def _send_json(
        send,
        status_code: int,
        content: dict,
        headers: list[tuple[bytes, bytes]] | None = None,
    ) -> None:
        body = json.dumps(content, ensure_ascii=False).encode("utf-8")
        resp_headers = [
            (b"content-type", b"application/json; charset=utf-8"),
            (b"content-length", str(len(body)).encode("ascii")),
        ]
        if headers:
            resp_headers.extend(headers)

        await send({
            "type": "http.response.start",
            "status": status_code,
            "headers": resp_headers,
        })
        await send({
            "type": "http.response.body",
            "body": body,
            "more_body": False,
        })

    def _is_upload_request(self, scope: dict) -> bool:
        return (
            scope.get("type") == "http"
            and scope.get("method") == "POST"
            and scope.get("path") in ("/api/v1/analyses", "/api/v1/analyses/")
        )

    async def __call__(self, scope, receive, send):
        if not self._is_upload_request(scope):
            await self.app(scope, receive, send)
            return

        # 1. Concurrency limit check before reading body or parsing multipart
        acquired = await self.limiter.try_acquire()
        if not acquired:
            logger.warning("Upload rejected: concurrency limit reached (%d active)", self.limiter.active_count)
            await self._send_json(
                send,
                status_code=429,
                content={
                    "detail": "Hệ thống đang xử lý nhiều tệp tải lên đồng thời. Vui lòng thử lại sau giây lát."
                },
                headers=[(b"retry-after", b"5")],
            )
            return

        try:
            # 2. Early Content-Length header check before reading any body chunk
            headers_dict = {k.lower(): v for k, v in scope.get("headers", [])}
            content_length_raw = headers_dict.get(b"content-length")
            if content_length_raw is not None:
                try:
                    content_length = int(content_length_raw)
                    if content_length > self.max_allowed_bytes:
                        logger.warning(
                            "Upload rejected early: Content-Length %d exceeds allowed %d",
                            content_length,
                            self.max_allowed_bytes,
                        )
                        await self._send_json(
                            send,
                            status_code=413,
                            content={"detail": "Tệp tải lên vượt quá giới hạn cho phép (15MB)."},
                        )
                        return
                except ValueError:
                    pass

            # 3. Stream byte counter wrapper for chunked / stream without or within initial length
            received_bytes = 0
            response_started = False

            async def monitored_receive():
                nonlocal received_bytes
                message = await receive()
                if message.get("type") == "http.request":
                    body = message.get("body", b"")
                    received_bytes += len(body)
                    if received_bytes > self.max_allowed_bytes:
                        logger.warning(
                            "Upload rejected: streamed bytes %d exceeded limit %d",
                            received_bytes,
                            self.max_allowed_bytes,
                        )
                        raise PayloadTooLargeError("Tệp tải lên vượt quá giới hạn cho phép (15MB).")
                return message

            async def wrapped_send(message):
                nonlocal response_started
                if message.get("type") == "http.response.start":
                    response_started = True
                await send(message)

            # 4. Timeout enforcement (compatible with Python >=3.10 via asyncio.wait_for)
            try:
                await asyncio.wait_for(
                    self.app(scope, monitored_receive, wrapped_send),
                    timeout=self.current_timeout,
                )
            except (asyncio.TimeoutError, TimeoutError):
                logger.warning("Upload timed out after %.1f seconds", self.current_timeout)
                if not response_started:
                    timeout_val = int(self.current_timeout) if float(self.current_timeout).is_integer() else self.current_timeout
                    await self._send_json(
                        send,
                        status_code=504,
                        content={"detail": f"Thời gian tải lên vượt quá giới hạn cho phép ({timeout_val} giây)."},
                    )
            except PayloadTooLargeError:
                if not response_started:
                    await self._send_json(
                        send,
                        status_code=413,
                        content={"detail": "Tệp tải lên vượt quá giới hạn cho phép (15MB)."},
                    )
            except asyncio.CancelledError:
                logger.info("Upload request was cancelled by client/timeout.")
                raise
        finally:
            await self.limiter.release()
