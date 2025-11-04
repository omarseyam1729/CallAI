import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog"

export default function AgentDialog({ open, onClose, onSave, initial, saving }) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [age, setAge] = useState(initial?.age ?? "")
  const [sex, setSex] = useState(initial?.sex ?? null)

  useEffect(() => {
    setName(initial?.name ?? "")
    setDescription(initial?.description ?? "")
    setAge(initial?.age ?? "")
    setSex(initial?.sex ?? null)
  }, [initial, open])

  const handleSubmit = () => {
    if (!name.trim()) return alert("Name is required")
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      age: age === "" ? null : Number(age),
      sex: sex || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Agent" : "Add Agent"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Age"
            value={age ?? ""}
            onChange={(e) => setAge(e.target.value)}
          />
          <Select value={sex ?? "none"} onValueChange={(v) => setSex(v === "none" ? null : v)}>
            <SelectTrigger>{sex ? sex : "Select Sex"}</SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
