import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { callsApi, agentsApi, pipelineApi, progressApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export default function CallDetails() {
  const { callId } = useParams<{ callId: string }>()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [callName, setCallName] = useState('')
  const [callDescription, setCallDescription] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [playingSegmentId, setPlayingSegmentId] = useState<number | null>(null)
  const [pipelineSteps, setPipelineSteps] = useState({
    transcription: true,
    summary: true,
    sentiment: true,
    semantic: true,
  })
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())

  const { data: call, isLoading } = useQuery({
    queryKey: ['call', callId],
    queryFn: () => callsApi.get(callId!),
    enabled: !!callId,
  })

  const { data: callData, isLoading: isLoadingCallData } = useQuery({
    queryKey: ['callData', callId],
    queryFn: () => callsApi.getCallData(callId!),
    enabled: !!callId,
  })

  const { data: segmentsData } = useQuery({
    queryKey: ['segments', callId],
    queryFn: () => callsApi.getSegments(callId!),
    enabled: !!callId,
  })

  const { data: progressData } = useQuery({
    queryKey: ['progress', callId],
    queryFn: () => progressApi.get(callId!),
    enabled: !!callId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if there are pending chunks
      return data && data.pending_chunks > 0 ? 2000 : false
    },
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  })

  // Sync form fields when call data loads
  useEffect(() => {
    if (call) {
      setCallName(call.call_name || '')
      setCallDescription(call.call_description || '')
      setSelectedAgentId(call.agent_id?.toString() || '')
    }
  }, [call])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioRefs.current.clear()
    }
  }, [])

  const updateMutation = useMutation({
    mutationFn: (data: { call_name?: string | null; call_description?: string | null; agent_id?: number | null }) =>
      callsApi.update(callId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call', callId] })
      toast({
        title: 'Updated',
        description: 'Call metadata updated successfully.',
      })
    },
  })

  const handleUpdate = () => {
    updateMutation.mutate({
      call_name: callName || null,
      call_description: callDescription || null,
      agent_id: selectedAgentId ? parseInt(selectedAgentId) : null,
    })
  }

  const pipelineMutation = useMutation({
    mutationFn: (steps: any) => pipelineApi.run(callId!, steps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call', callId] })
      queryClient.invalidateQueries({ queryKey: ['callData', callId] })
      queryClient.invalidateQueries({ queryKey: ['segments', callId] })
      queryClient.invalidateQueries({ queryKey: ['progress', callId] })
      toast({
        title: 'Pipeline started',
        description: 'Analysis pipeline is running...',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start pipeline',
        variant: 'destructive',
      })
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => pipelineApi.reset(callId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call', callId] })
      queryClient.invalidateQueries({ queryKey: ['callData', callId] })
      queryClient.invalidateQueries({ queryKey: ['segments', callId] })
      queryClient.invalidateQueries({ queryKey: ['progress', callId] })
      toast({
        title: 'Reset complete',
        description: 'Call has been reset to initial state.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset call',
        variant: 'destructive',
      })
    },
  })

  const handleRunPipeline = () => {
    pipelineMutation.mutate(pipelineSteps)
  }

  const handlePlaySegment = async (segmentId: number) => {
    // Stop any currently playing audio
    if (playingSegmentId !== null) {
      const currentAudio = audioRefs.current.get(playingSegmentId)
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    // If clicking the same segment, toggle pause/play
    if (playingSegmentId === segmentId) {
      setPlayingSegmentId(null)
      return
    }

    // Get or create audio element
    let audio = audioRefs.current.get(segmentId)
    if (!audio) {
      audio = new Audio()
      audioRefs.current.set(segmentId, audio)
    }

    // Set audio source
    const audioUrl = `${API_BASE_URL}/call/transcription/${callId}/segments/${segmentId}/audio`
    audio.src = audioUrl
    audio.onended = () => setPlayingSegmentId(null)
    audio.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to load audio segment',
        variant: 'destructive',
      })
      setPlayingSegmentId(null)
    }

    try {
      await audio.play()
      setPlayingSegmentId(segmentId)
    } catch (error) {
      console.error('Error playing audio:', error)
      toast({
        title: 'Error',
        description: 'Failed to play audio segment',
        variant: 'destructive',
      })
    }
  }

  if (isLoading || isLoadingCallData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!call) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Prepare data for charts
  const segmentCount = segmentsData?.segments.length || 0
  const speakerCounts: Record<string, number> = {}
  const sentimentCounts: Record<string, number> = {}
  const emotionCounts: Record<string, number> = {}

  segmentsData?.segments.forEach((segment) => {
    speakerCounts[segment.speaker] = (speakerCounts[segment.speaker] || 0) + 1
    if (segment.sentiment_label) {
      sentimentCounts[segment.sentiment_label] = (sentimentCounts[segment.sentiment_label] || 0) + 1
    }
    if (segment.emotion_label) {
      emotionCounts[segment.emotion_label] = (emotionCounts[segment.emotion_label] || 0) + 1
    }
  })

  const speakerChartData = Object.entries(speakerCounts).map(([speaker, count]) => ({
    speaker,
    count,
  }))

  const sentimentChartData = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
    sentiment,
    count,
  }))

  const emotionChartData = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {call.call_name || `Call ${call.id.slice(0, 8)}`}
        </h1>
        <p className="text-muted-foreground">
          Uploaded {formatDate(call.upload_time)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Information</CardTitle>
            <CardDescription>Update call metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Call Name</Label>
              <Input
                id="name"
                value={callName || call.call_name || ''}
                onChange={(e) => setCallName(e.target.value)}
                placeholder="Enter call name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={callDescription || call.call_description || ''}
                onChange={(e) => setCallDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="agent">Agent</Label>
              <Select
                value={selectedAgentId || call.agent_id?.toString() || 'none'}
                onValueChange={(v) => setSelectedAgentId(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Overview</CardTitle>
            <CardDescription>Visual summary of call analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{segmentCount}</div>
                  <div className="text-sm text-muted-foreground">Segments</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{Object.keys(speakerCounts).length}</div>
                  <div className="text-sm text-muted-foreground">Speakers</div>
                </div>
              </div>
              {callData?.sentiment_label && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Overall Sentiment</span>
                  <Badge>{callData.sentiment_label}</Badge>
                </div>
              )}
              {callData?.emotion_label && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Overall Emotion</span>
                  <Badge variant="outline">{callData.emotion_label}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Controls</CardTitle>
          <CardDescription>Run analysis pipeline steps on this call</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Steps</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pipelineSteps.transcription}
                  onChange={(e) =>
                    setPipelineSteps({ ...pipelineSteps, transcription: e.target.checked })
                  }
                />
                <span className="text-sm">Transcription</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pipelineSteps.summary}
                  onChange={(e) =>
                    setPipelineSteps({ ...pipelineSteps, summary: e.target.checked })
                  }
                />
                <span className="text-sm">Summary</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pipelineSteps.sentiment}
                  onChange={(e) =>
                    setPipelineSteps({ ...pipelineSteps, sentiment: e.target.checked })
                  }
                />
                <span className="text-sm">Sentiment</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pipelineSteps.semantic}
                  onChange={(e) =>
                    setPipelineSteps({ ...pipelineSteps, semantic: e.target.checked })
                  }
                />
                <span className="text-sm">Semantic</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRunPipeline}
              disabled={pipelineMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {pipelineMutation.isPending ? 'Running...' : 'Run Pipeline'}
            </Button>
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {resetMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {progressData && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Progress</CardTitle>
            <CardDescription>Current status of call analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progressData.progress_percent)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressData.progress_percent}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Chunks</div>
                <div className="text-lg font-semibold">{progressData.total_chunks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Completed</div>
                <div className="text-lg font-semibold text-green-600">{progressData.done_chunks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="text-lg font-semibold text-yellow-600">{progressData.pending_chunks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Errors</div>
                <div className="text-lg font-semibold text-red-600">{progressData.error_chunks}</div>
              </div>
            </div>
            {progressData.pending_chunks === 0 && progressData.error_chunks === 0 && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Processing complete
              </div>
            )}
            {progressData.error_chunks > 0 && (
              <div className="text-sm text-red-600 font-medium">
                ⚠ {progressData.error_chunks} chunk(s) failed to process
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {callData?.llm_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Call Summary</CardTitle>
            <CardDescription>AI-generated summary of the conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">{callData.llm_summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {segmentsData?.segments && segmentsData.segments.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {speakerChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Segments by Speaker</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={speakerChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="speaker" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {sentimentChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.sentiment}: ${entry.count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {sentimentChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {emotionChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={emotionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Diarized Segments</CardTitle>
              <CardDescription>Transcript with speaker identification, timestamps, and audio playback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {segmentsData.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="border-l-4 pl-4 py-3 border-l-blue-500 hover:bg-muted/50 rounded-r-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePlaySegment(segment.id)}
                      >
                        {playingSegmentId === segment.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Badge variant="secondary">{segment.speaker}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                      {segment.sentiment_label && (
                        <Badge variant="outline" className="text-xs">
                          {segment.sentiment_label}
                        </Badge>
                      )}
                      {segment.emotion_label && (
                        <Badge variant="outline" className="text-xs">
                          {segment.emotion_label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm ml-10">{segment.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {callData?.full_transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Full Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
              {callData.full_transcript}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
