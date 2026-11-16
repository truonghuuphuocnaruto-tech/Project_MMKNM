from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status

from app.schemas import (
    AnalysisCreateResponse,
    AnalysisDetailResponse,
    EducationalMockCue,
    FileFacts,
)
from app.services.analysis_store import store
from app.services.media_facts import (
    DEFAULT_EDUCATIONAL_CUES,
    DEFAULT_RECOMMENDATIONS,
    VERIFICATION_CHECKLIST,
    MediaDurationLimitError,
    UnsupportedMediaTypeError,
    extract_duration_safe,
    sanitize_filename,
    validate_media_type,
)
from app.services.storage import (
    UploadTooLargeError,
    remove_quarantine_file,
    stream_upload_to_quarantine,
)

router = APIRouter(prefix="/api/v1/analyses", tags=["Analyses"])


@router.post("", response_model=AnalysisCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_analysis(file: UploadFile = File(...)):
    """
    Upload an audio or video file for analysis.
    Safely streams to a quarantine directory, calculates actual file facts (size, SHA-256),
    validates format/size restrictions, and produces an educational demo report.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp không hợp lệ hoặc thiếu tên tệp.",
        )

    safe_name = sanitize_filename(file.filename)

    # 1. Validate MIME type & file extension
    try:
        ext, mime_type = validate_media_type(safe_name, file.content_type)
    except UnsupportedMediaTypeError as err:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(err),
        )

    # 2. Stream to quarantine with strict byte limit
    quarantine_path = None
    try:
        try:
            quarantine_path, sha256_hash, total_bytes = await stream_upload_to_quarantine(file)
        except UploadTooLargeError as err:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=str(err),
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lỗi khi xử lý dữ liệu tải lên.",
            )

        # 3. Extract safe duration if media permits
        try:
            duration_seconds = extract_duration_safe(quarantine_path, ext)
        except MediaDurationLimitError as err:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(err)) from err

        analysis_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        # 4. Assemble factual report and educational mock signals
        payload = {
            "id": analysis_id,
            "status": "completed",
            "mode": "demo",
            "file_facts": {
                "file_name": safe_name,
                "file_size_bytes": total_bytes,
                "mime_type": mime_type,
                "sha256_hash": sha256_hash,
                "duration_seconds": duration_seconds,
            },
            "ai_status": "Phân tích AI chưa khả dụng trong v1",
            "confidence": None,
            "educational_mock_cues": [cue.model_dump() for cue in DEFAULT_EDUCATIONAL_CUES],
            "verification_checklist": VERIFICATION_CHECKLIST,
            "recommendations": DEFAULT_RECOMMENDATIONS,
        }

        # Save to store
        store.save(analysis_id, payload)

        return AnalysisCreateResponse(
            id=analysis_id,
            status="completed",
            created_at=created_at,
        )
    finally:
        # 5. Immediate cleanup of the quarantine file after facts are computed
        if quarantine_path:
            remove_quarantine_file(quarantine_path)


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse, status_code=status.HTTP_200_OK)
async def get_analysis(analysis_id: str):
    """
    Retrieve an analysis result by its UUID.
    Includes verified file facts and educational verification guidelines.
    """
    analysis = store.get(analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên phân tích không tồn tại hoặc đã bị xóa.",
        )

    return AnalysisDetailResponse(**analysis)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(analysis_id: str):
    """
    Delete an analysis session and purge any lingering associated quarantine files immediately.
    """
    success = store.delete(analysis_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên phân tích không tồn tại hoặc đã bị xóa.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
