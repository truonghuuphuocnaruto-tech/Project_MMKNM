from typing import Literal
from pydantic import BaseModel, Field


class HealthLiveResponse(BaseModel):
    status: Literal["live"] = "live"


class HealthReadyResponse(BaseModel):
    status: Literal["ready"] = "ready"
    storage_writable: bool = True


class FileFacts(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    duration_seconds: float | None = None


class EducationalMockCue(BaseModel):
    category: str
    label: str
    description: str


class AnalysisCreateResponse(BaseModel):
    id: str
    status: Literal["processing", "completed", "failed"] = "completed"
    created_at: str


class AnalysisDetailResponse(BaseModel):
    id: str
    status: Literal["processing", "completed", "failed"]
    mode: Literal["demo"] = "demo"
    file_facts: FileFacts
    ai_status: str = "Phân tích AI chưa khả dụng trong v1"
    confidence: None = None
    educational_mock_cues: list[EducationalMockCue] = Field(default_factory=list)
    verification_checklist: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class ErrorDetail(BaseModel):
    detail: str
