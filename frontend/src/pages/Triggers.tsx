import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { triggersApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Trigger } from '@/lib/types'

export default function Triggers() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'regex' as 'regex' | 'semantic',
    description: '',
    pattern: '',
    caseSensitive: false,
    criteriaText: '',
  })

  const { data: triggers, isLoading } = useQuery({
    queryKey: ['triggers'],
    queryFn: () => triggersApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (trigger: Omit<Trigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      triggersApi.create(trigger),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
      toast({ title: 'Trigger created', description: 'Trigger has been created successfully.' })
      setIsDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Trigger>) => triggersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
      toast({ title: 'Trigger updated', description: 'Trigger has been updated successfully.' })
      setIsDialogOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => triggersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
      toast({ title: 'Trigger deleted', description: 'Trigger has been deleted successfully.' })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'regex',
      description: '',
      pattern: '',
      caseSensitive: false,
      criteriaText: '',
    })
    setEditingTrigger(null)
  }

  const handleOpenDialog = (trigger?: Trigger) => {
    if (trigger) {
      setEditingTrigger(trigger)
      setFormData({
        name: trigger.name,
        type: trigger.type,
        description: trigger.description || '',
        pattern: trigger.config.pattern || '',
        caseSensitive: trigger.config.case_sensitive || false,
        criteriaText: trigger.config.criteria_text || '',
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    const config =
      formData.type === 'regex'
        ? { pattern: formData.pattern, case_sensitive: formData.caseSensitive }
        : { criteria_text: formData.criteriaText }

    const triggerData = {
      name: formData.name,
      type: formData.type,
      config,
      description: formData.description || undefined,
    }

    if (editingTrigger) {
      updateMutation.mutate({ ...editingTrigger, ...triggerData })
    } else {
      createMutation.mutate(triggerData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Triggers</h1>
          <p className="text-muted-foreground">Manage evaluation triggers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTrigger ? 'Edit Trigger' : 'Create Trigger'}</DialogTitle>
              <DialogDescription>
                {editingTrigger ? 'Update trigger configuration' : 'Create a new evaluation trigger'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Trigger name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as 'regex' | 'semantic' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regex">Regex</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'regex' ? (
                <>
                  <div>
                    <Label htmlFor="pattern">Pattern *</Label>
                    <Input
                      id="pattern"
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      placeholder="Regular expression pattern"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="caseSensitive"
                      checked={formData.caseSensitive}
                      onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                    />
                    <Label htmlFor="caseSensitive">Case sensitive</Label>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="criteriaText">Criteria Text *</Label>
                  <Textarea
                    id="criteriaText"
                    value={formData.criteriaText}
                    onChange={(e) => setFormData({ ...formData, criteriaText: e.target.value })}
                    placeholder="Enter the criteria to evaluate (e.g., 'Was there a mistake in the call?')"
                    rows={4}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Trigger description"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  (formData.type === 'regex' && !formData.pattern) ||
                  (formData.type === 'semantic' && !formData.criteriaText) ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {editingTrigger ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers && triggers.length > 0 ? (
                triggers.map((trigger) => (
                  <TableRow key={trigger.id}>
                    <TableCell className="font-medium">{trigger.name}</TableCell>
                    <TableCell>
                      <Badge variant={trigger.type === 'regex' ? 'default' : 'secondary'}>
                        {trigger.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{trigger.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(trigger)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this trigger?')) {
                              deleteMutation.mutate(trigger.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No triggers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

