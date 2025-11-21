import axios from 'axios'
import type {
  Call,
  Agent,
  Trigger,
  TriggerEvalResult,
  RunBatch,
  SearchResult,
  OverviewMetrics,
  PaginatedCallsResponse,
  CallDetailOut,
  CallUpdateIn,
  ProgressResponse,
  PipelineStepsRequest,
  PipelineRunResponse,
  SegmentsResponse,
  CallDataResponse,
  ChatMessage,
  ChatMessageResponse,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// Calls API
export const callsApi = {
  list: async (params?: {
    page?: number
    per_page?: number
    order?: 'asc' | 'desc'
    q?: string
    date_from?: string
    date_to?: string
    agent_name?: string
    agent_id?: number
  }): Promise<PaginatedCallsResponse> => {
    const { data } = await api.get<PaginatedCallsResponse>('/calls', { params })
    return data
  },

  get: async (callId: string): Promise<CallDetailOut> => {
    const { data } = await api.get<CallDetailOut>(`/calls/${callId}`)
    return data
  },

  update: async (callId: string, payload: CallUpdateIn): Promise<CallDetailOut> => {
    const { data } = await api.patch<CallDetailOut>(`/calls/${callId}`, payload)
    return data
  },

  getMetrics: async (callId: string) => {
    const { data } = await api.get(`/calls/${callId}/metrics`)
    return data
  },

  getSegments: async (callId: string) => {
    const { data } = await api.get<SegmentsResponse>(`/call/transcription/${callId}/segments`)
    return data
  },

  getCallData: async (callId: string): Promise<CallDataResponse> => {
    const { data } = await api.get<CallDataResponse>(`/call/transcription/${callId}/data`)
    return data
  },
}

// Upload API
export const uploadApi = {
  upload: async (file: File): Promise<Call> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<Call>('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}

// Pipeline API
export const pipelineApi = {
  run: async (callId: string, steps?: PipelineStepsRequest): Promise<PipelineRunResponse> => {
    const { data } = await api.post<PipelineRunResponse>(`/pipeline/${callId}/run`, steps)
    return data
  },

  reset: async (callId: string) => {
    const { data } = await api.post(`/pipeline/${callId}/reset`)
    return data
  },
}

// Progress API
export const progressApi = {
  get: async (callId: string): Promise<ProgressResponse> => {
    const { data } = await api.get<ProgressResponse>(`/call/progress/${callId}`)
    return data
  },

  stream: (callId: string): EventSource => {
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api')
    return new EventSource(`${baseUrl}/call/progress/${callId}/stream`)
  },
}

// Agents API
export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    const { data } = await api.get<Agent[]>('/agents')
    return data
  },

  get: async (agentId: number): Promise<Agent> => {
    const { data } = await api.get<Agent>(`/agents/${agentId}`)
    return data
  },

  create: async (agent: Omit<Agent, 'id'>): Promise<Agent> => {
    const { data } = await api.post<Agent>('/agents', agent)
    return data
  },

  update: async (agentId: number, agent: Partial<Agent>): Promise<Agent> => {
    const { data } = await api.put<Agent>(`/agents/${agentId}`, agent)
    return data
  },

  delete: async (agentId: number): Promise<void> => {
    await api.delete(`/agents/${agentId}`)
  },
}

// Triggers API
export const triggersApi = {
  list: async (): Promise<Trigger[]> => {
    const { data } = await api.get<Trigger[]>('/triggers')
    return data
  },

  get: async (triggerId: number): Promise<Trigger> => {
    const { data } = await api.get<Trigger>(`/triggers/${triggerId}`)
    return data
  },

  create: async (trigger: Omit<Trigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Trigger> => {
    const { data } = await api.post<Trigger>('/triggers', trigger)
    return data
  },

  update: async (triggerId: number, trigger: Partial<Trigger>): Promise<Trigger> => {
    const { data } = await api.patch<Trigger>(`/triggers/${triggerId}`, trigger)
    return data
  },

  delete: async (triggerId: number): Promise<void> => {
    await api.delete(`/triggers/${triggerId}`)
  },

  evaluate: async (triggerId: number, callId: string): Promise<TriggerEvalResult> => {
    const { data } = await api.post<TriggerEvalResult>(`/triggers/${triggerId}/evaluate`, { call_id: callId })
    return data
  },

  evaluateMultiple: async (triggerIds: number[], callId: string): Promise<TriggerEvalResult[]> => {
    const { data } = await api.post<TriggerEvalResult[]>('/triggers/evaluate', {
      call_id: callId,
      trigger_ids: triggerIds,
    })
    return data
  },

  getEvaluations: async (triggerId: number, limit = 50, offset = 0): Promise<TriggerEvalResult[]> => {
    const { data } = await api.get<TriggerEvalResult[]>(`/triggers/${triggerId}/evaluations`, {
      params: { limit, offset },
    })
    return data
  },
}

// Batch API
export const batchApi = {
  list: async (): Promise<RunBatch[]> => {
    const { data } = await api.get<RunBatch[]>('/batch')
    return data
  },

  get: async (batchId: number): Promise<RunBatch> => {
    const { data } = await api.get<RunBatch>(`/batch/${batchId}`)
    return data
  },

  create: async (batch: {
    name: string
    description?: string
    steps: Record<string, boolean>
    trigger_ids: number[]
    fail_fast: boolean
  }): Promise<RunBatch> => {
    const { data } = await api.post<RunBatch>('/batch', batch)
    return data
  },

  delete: async (batchId: number): Promise<void> => {
    await api.delete(`/batch/${batchId}`)
  },

  attachCalls: async (batchId: number, callIds: string[]): Promise<void> => {
    await api.post(`/batch/${batchId}/calls`, { call_ids: callIds })
  },

  detachCalls: async (batchId: number, callIds: string[]): Promise<void> => {
    await api.delete(`/batch/${batchId}/calls`, { data: { call_ids: callIds } })
  },

  attachTriggers: async (batchId: number, triggerIds: number[]): Promise<void> => {
    await api.post(`/batch/${batchId}/triggers`, { trigger_ids: triggerIds })
  },

  detachTriggers: async (batchId: number, triggerIds: number[]): Promise<void> => {
    await api.delete(`/batch/${batchId}/triggers`, { data: { trigger_ids: triggerIds } })
  },

  start: async (batchId: number): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/batch/${batchId}/start`)
    return data
  },

  getProgress: async (batchId: number) => {
    const { data } = await api.get(`/batch/${batchId}/progress`)
    return data
  },

  getReport: async (batchId: number) => {
    const { data } = await api.get(`/batch/${batchId}/report`)
    return data
  },
}

// Search API
export const searchApi = {
  keyword: async (query: string, callId?: string, topK = 10): Promise<SearchResult[]> => {
    const { data } = await api.post<SearchResult[]>('/search/keyword', {
      query,
      call_id: callId,
      top_k: topK,
    })
    return data
  },

  semantic: async (query: string, topK = 5): Promise<SearchResult[]> => {
    const { data } = await api.post<SearchResult[]>('/search/semantic', {
      query,
      top_k: topK,
    })
    return data
  },
}

// Metrics API
export const metricsApi = {
  getOverview: async (): Promise<OverviewMetrics> => {
    const { data } = await api.get<OverviewMetrics>('/metrics')
    return data
  },
}

// Chat API
export const chatApi = {
  sendMessage: async (message: string, history: ChatMessage[]): Promise<ChatMessageResponse> => {
    const { data } = await api.post<ChatMessageResponse>('/chat/message', {
      message,
      conversation_history: history,
    })
    return data
  },
}

export default api

