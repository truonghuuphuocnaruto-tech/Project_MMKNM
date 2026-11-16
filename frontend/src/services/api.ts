import { AnalysisResult, UploadResponse, HealthStatus } from '../types/api';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// Strip trailing slash if present
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/analyses`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60000),
    });
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    if (errorObj?.name === 'TimeoutError' || errorObj?.message?.toLowerCase().includes('timeout')) {
      throw new ApiError(
        'Thời gian tải lên vượt quá giới hạn cho phép (60 giây). Vui lòng thử lại với kết nối mạng ổn định hơn.',
        504,
        err
      );
    }
    throw new ApiError(
      'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra xem backend đã được khởi chạy chưa (cổng 8000).',
      0,
      err
    );
  }

  if (response.status === 413) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      errorData.detail ||
      'Tệp quá lớn. Máy chủ từ chối tiếp nhận vì dung lượng vượt quá giới hạn cho phép (15MB).';
    throw new ApiError(detail, 413, errorData);
  }

  if (response.status === 429 || response.status === 503) {
    const errorData = await response.json().catch(() => ({}));
    const retryAfter = response.headers.get('Retry-After');
    const retrySuffix = retryAfter ? ` (vui lòng thử lại sau ${retryAfter} giây)` : ' (vui lòng thử lại sau giây lát)';
    const detail =
      errorData.detail ||
      `Hệ thống đang xử lý nhiều tệp tải lên đồng thời. Vui lòng thử lại sau giây lát.${retrySuffix}`;
    throw new ApiError(detail, response.status, errorData);
  }

  if (response.status === 504 || response.status === 408) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      errorData.detail ||
      'Thời gian tải lên vượt quá giới hạn cho phép (60 giây). Vui lòng thử lại với kết nối mạng ổn định hơn.';
    throw new ApiError(detail, response.status, errorData);
  }

  if (response.status === 415 || response.status === 400) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      errorData.detail ||
      errorData.message ||
      'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận tệp âm thanh (.mp3, .wav, .ogg) hoặc video (.mp4, .webm).';
    throw new ApiError(detail, response.status, errorData);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail ||
      errorData.message ||
      `Lỗi máy chủ (${response.status}): Không thể xử lý tệp.`;
    throw new ApiError(message, response.status, errorData);
  }

  return response.json();
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/analyses/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err: unknown) {
    const errorObj = err as { name?: string };
    if (errorObj?.name === 'TimeoutError') {
      throw new ApiError('Quá thời gian kết nối khi đang kiểm tra trạng thái phân tích.', 504, err);
    }
    throw new ApiError(
      'Mất kết nối với máy chủ khi đang kiểm tra trạng thái phân tích.',
      0,
      err
    );
  }

  if (response.status === 404) {
    throw new ApiError('Phiên phân tích không tồn tại hoặc đã bị xóa.', 404);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `Lỗi khi tải kết quả (${response.status}).`,
      response.status,
      errorData
    );
  }

  return response.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/analyses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    throw new ApiError(
      'Không thể kết nối đến máy chủ để xóa phiên phân tích.',
      0,
      err
    );
  }

  if (response.status === 404) {
    // Already deleted or non-existent, treat as success
    return;
  }

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `Không thể xóa phiên (${response.status}).`,
      response.status
    );
  }
}

export async function checkBackendHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/ready`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return await response.json();
    }
    // Fallback to /health/live
    const liveResponse = await fetch(`${API_BASE_URL}/health/live`, {
      signal: AbortSignal.timeout(5000),
    });
    if (liveResponse.ok) {
      return await liveResponse.json();
    }
    return null;
  } catch {
    return null;
  }
}
