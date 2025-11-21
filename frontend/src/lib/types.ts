// Types matching backend Pydantic schemas

export interface Call {
  id: string
  filename: string
  folder_path: string
  upload_time: string
  chunks?: AudioChunk[]
  call_data?: CallData
}

export interface CallData {
  id?: number
  call_id: string
  call_name?: string
  call_description?: string
  agent_id?: number
  full_transcript?: string
  llm_summary?: string
  sentiment_label?: string
  sentiment_confidence?: number
  emotion_label?: string
  emotion_confidence?: number
  agent?: Agent
}

export interface AudioChunk {
  id: number
  call_id: string
  chunk_path: string
  start_time: number
  end_time: number
  status: string
  segments?: Segment[]
}

export interface Segment {
  id: number
  chunk_id: number
  speaker: string
  start: number
  end: number
  text?: string
  sentiment_label?: string
  sentiment_confidence?: number
  emotion_label?: string
  emotion_confidence?: number
  words?: Word[]
}

export interface Word {
  id: number
  segment_id: number
  word: string
  start: number
  end: number
  confidence?: number
}

export interface Agent {
  id: number
  name: string
  description?: string
  age?: number
  sex?: string
}

export interface Trigger {
  id: number
  name: string
  type: 'regex' | 'semantic'
  config: Record<string, any>
  description?: string
  user_id: number
  created_at?: string
  updated_at?: string
}

export interface TriggerEvalResult {
  call_id: string
  trigger_id: number
  trigger_name: string
  matched: boolean
  score?: number
  evidence?: Record<string, any>
}

export interface RunBatch {
  id: number
  user_id: number
  name: string
  description?: string
  steps_json?: string
  fail_fast: boolean
  status: 'draft' | 'running' | 'succeeded' | 'failed' | 'stopped'
  created_at: string
  started_at?: string
  finished_at?: string
}

export interface RunBatchCall {
  id: number
  batch_id: number
  call_id: string
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'
  started_at?: string
  finished_at?: string
  result_summary?: string
  error?: string
  chunk_total: number
  chunk_done: number
  chunk_error: number
}

export interface SearchResult {
  segment_id: number
  call_id: string
  text: string
  speaker?: string
  start: number
  end: number
  duration: number
  score: number
}

export interface OverviewMetrics {
  total_words: number
  total_calls: number
  total_segments: number
  total_duration_sec: number
  completed_chunks: number
  pending_chunks: number
  sentiments: Record<string, number>
  emotions: Record<string, number>
  total_triggers: number
  total_trigger_evals: number
  triggers_matched: number
  triggers_unmatched: number
  generated_at: string
}

// CallOut - matches backend CallOut schema for list responses
export interface CallOut {
  id: string
  call_name?: string | null
  call_description?: string | null
  upload_time: string
  duration_sec: number
  agent_id?: number | null
  agent_name?: string | null
}

export interface PaginatedCallsResponse {
  items: CallOut[]
  total: number
  page: number
  per_page: number
  page_count: number
  next_page?: number | null
  prev_page?: number | null
}

export interface CallDetailOut {
  id: string
  upload_time: string
  call_name?: string | null
  call_description?: string | null
  agent_id?: number | null
}

export interface SegmentsResponse {
  call_id: string
  segments: Segment[]
}

export interface CallDataResponse {
  call_id: string
  full_transcript: string | null
  llm_summary: string | null
  sentiment_label: string | null
  sentiment_confidence: number | null
  emotion_label: string | null
  emotion_confidence: number | null
}

// Chat types for callAI feature
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatMessageResponse {
  answer: string
  query_used?: string | null
  timestamp: string
}

export interface CallUpdateIn {
  call_name?: string | null
  call_description?: string | null
  agent_id?: number | null
}

export interface ProgressResponse {
  call_id: string
  total_chunks: number
  done_chunks: number
  pending_chunks: number
  error_chunks: number
  progress_percent: number
}

export interface PipelineStepsRequest {
  transcription?: boolean
  summary?: boolean
  sentiment?: boolean
  semantic?: boolean
}

export interface PipelineRunResponse {
  call_id: string
  steps_run: string[]
  transcript_len: number
  summary_len: number
}

