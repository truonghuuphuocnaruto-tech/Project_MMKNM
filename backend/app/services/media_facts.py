import re
import wave
from pathlib import Path

from app.config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES
from app.schemas import EducationalMockCue


class UnsupportedMediaTypeError(Exception):
    """Raised when an uploaded file is not in the allowed audio/video media types."""
    pass


class MediaDurationLimitError(Exception):
    pass


VERIFICATION_CHECKLIST: list[str] = [
    "Gọi lại số chính thức đã biết trước đó của cá nhân hoặc cơ quan yêu cầu (tuyệt đối không dùng số điện thoại do người gọi cung cấp).",
    "Xác thực qua kênh thứ hai độc lập (ví dụ gặp mặt trực tiếp, liên hệ người thân hoặc gọi video qua nền tảng phụ).",
    "Đặt câu hỏi kiểm tra thông tin bí mật hoặc sự kiện cá nhân mà chỉ người thân thật sự mới có thể trả lời đúng.",
    "Tuyệt đối không chuyển tiền, không quét mã QR, không chia sẻ mã OTP/mật khẩu trong tình huống gấp gáp, bị đe dọa.",
]

DEFAULT_RECOMMENDATIONS: list[str] = [
    "Xác minh qua kênh độc lập đã biết",
    "Không chuyển tiền theo yêu cầu gấp",
]

DEFAULT_EDUCATIONAL_CUES: list[EducationalMockCue] = [
    EducationalMockCue(
        category="audio_artifact",
        label="[Minh họa / Mock cues] Ví dụ dải cao tần bất thường",
        description="Mẫu cảnh báo kiểm tra âm học minh họa cho mục đích đào tạo nhận thức an ninh.",
    ),
    EducationalMockCue(
        category="visual_artifact",
        label="[Minh họa / Mock cues] Ví dụ bất thường vùng biên khuôn mặt",
        description="Mẫu cảnh báo kiểm tra thị giác minh họa cho mục đích đào tạo nhận thức an ninh.",
    ),
]


def sanitize_filename(raw_name: str | None) -> str:
    """
    Sanitize client-provided filename.
    Removes path traversal, control characters, and returns a safe base name.
    """
    if not raw_name:
        return "unnamed_media.bin"

    # Strip directory components (both / and \)
    cleaned = raw_name.replace("\\", "/").split("/")[-1]
    # Remove null bytes and non-printable characters
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", cleaned).strip()
    # Replace dangerous symbols or spaces with underscores, keep safe characters
    cleaned = re.sub(r"[^\w.\-]", "_", cleaned)

    if not cleaned or cleaned.startswith("."):
        return f"safe_{cleaned}" if cleaned else "unnamed_media.bin"

    return cleaned[:120]  # Cap length


def validate_media_type(filename: str, content_type: str | None) -> tuple[str, str]:
    """
    Validate extension and MIME type against the strict allowlist.
    Returns (cleaned_extension, normalized_mime_type).
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedMediaTypeError(
            f"Định dạng tệp không được hỗ trợ ({ext or 'không rõ'}). Chỉ chấp nhận: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    mime = (content_type or "").lower().split(";")[0].strip()
    # Normalize common variations
    if mime == "audio/x-wav":
        mime = "audio/wav"

    if mime not in ALLOWED_MIME_TYPES:
        raise UnsupportedMediaTypeError(
            f"MIME type '{mime}' không được hỗ trợ. Chỉ chấp nhận các loại âm thanh/video an toàn."
        )

    return ext, mime


def extract_duration_safe(file_path: Path, extension: str) -> float | None:
    """
    Tạm ngừng gọi parser media (kể cả wave.open) trên file upload của người dùng
    do chưa có container sandbox độc lập trên host.
    Trả về None (duration_seconds: null) để đảm bảo không chạy parser media trực tiếp
    trên tiến trình backend host. Giới hạn thời lượng 60s tạm thời chưa được xác minh khi tắt parser.
    """
    return None
