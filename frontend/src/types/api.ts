export interface FileFacts {
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  duration_seconds: number | null;
}

export interface EducationalMockCue {
  category: string;
  label: string;
  description: string;
}

export interface AnalysisResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  mode: 'demo' | string;
  file_facts: FileFacts;
  ai_status: string;
  educational_mock_cues: EducationalMockCue[];
  recommendations: string[];
  created_at?: string;
  error?: string;
}

export interface UploadResponse {
  id: string;
  status: 'processing' | 'completed';
  created_at?: string;
}

export interface HealthStatus {
  status: string;
  storage_writable?: boolean;
}
