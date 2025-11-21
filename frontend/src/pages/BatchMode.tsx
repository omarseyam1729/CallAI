import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { batchApi, triggersApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Play, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function BatchMode() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transcription: true,
    summary: true,
    sentiment: true,
    semantic: true,
    failFast: false,
    triggerIds: [] as number[],
  })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.list(),
  })

  const { data: triggers } = useQuery({
    queryKey: ['triggers'],
    queryFn: () => triggersApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => batchApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast({ title: 'Batch created', description: 'Batch has been created successfully.' })
      setIsDialogOpen(false)
      setFormData({
        name: '',
        description: '',
        transcription: true,
        summary: true,
        sentiment: true,
        semantic: true,
        failFast: false,
        triggerIds: [],
      })
    },
  })

  const startMutation = useMutation({
    mutationFn: (batchId: number) => batchApi.start(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast({ title: 'Batch started', description: 'Batch processing has started.' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (batchId: number) => batchApi.delete(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast({ title: 'Batch deleted', description: 'Batch has been deleted successfully.' })
    },
  })

  const handleSubmit = () => {
    const steps: Record<string, boolean> = {}
    if (formData.transcription) steps.transcription = true
    if (formData.summary) steps.summary = true
    if (formData.sentiment) steps.sentiment = true
    if (formData.semantic) steps.semantic = true

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      steps,
      trigger_ids: formData.triggerIds,
      fail_fast: formData.failFast,
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      running: 'default',
      succeeded: 'default',
      failed: 'destructive',
      stopped: 'secondary',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Processing</h1>
          <p className="text-muted-foreground">Manage batch processing jobs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Batch</DialogTitle>
              <DialogDescription>Create a new batch processing job</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Batch name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Batch description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Pipeline Steps</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.transcription}
                      onChange={(e) => setFormData({ ...formData, transcription: e.target.checked })}
                    />
                    <span className="text-sm">Transcription</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.checked })}
                    />
                    <span className="text-sm">Summary</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sentiment}
                      onChange={(e) => setFormData({ ...formData, sentiment: e.target.checked })}
                    />
                    <span className="text-sm">Sentiment</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.semantic}
                      onChange={(e) => setFormData({ ...formData, semantic: e.target.checked })}
                    />
                    <span className="text-sm">Semantic</span>
                  </label>
                </div>
              </div>
              <div>
                <Label>Triggers (optional)</Label>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                  {triggers?.map((trigger) => (
                    <label key={trigger.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.triggerIds.includes(trigger.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, triggerIds: [...formData.triggerIds, trigger.id] })
                          } else {
                            setFormData({ ...formData, triggerIds: formData.triggerIds.filter(id => id !== trigger.id) })
                          }
                        }}
                      />
                      <span className="text-sm">{trigger.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="failFast"
                  checked={formData.failFast}
                  onChange={(e) => setFormData({ ...formData, failFast: e.target.checked })}
                />
                <Label htmlFor="failFast">Fail Fast</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {batches && batches.length > 0 ? (
            batches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{batch.name}</CardTitle>
                      <CardDescription>{batch.description || 'No description'}</CardDescription>
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created {formatDate(batch.created_at)}
                    </div>
                    <div className="flex gap-2">
                      {batch.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => startMutation.mutate(batch.id)}
                          disabled={startMutation.isPending}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this batch?')) {
                            deleteMutation.mutate(batch.id)
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No batches found
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

