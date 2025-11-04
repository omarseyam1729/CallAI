import React, { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import AgentsTable from "@/components/agents/AgentsTable"
import AgentDialog from "@/components/agents/AgentDialog"
import DeleteDialog from "@/components/agents/DeleteDialog"

export default function AgentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState(null)
  const [openDeleteId, setOpenDeleteId] = useState(null)
  const [message, setMessage] = useState("")

  const notify = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(""), 3000)
  }

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(api("/agents"))
      setRows(data || [])
    } catch (err) {
      console.error(err)
      notify("Failed to load agents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleSave = async (payload) => {
    try {
      if (editing) {
        setBusyId(editing.id)
        const { data } = await axios.put(api(`/agents/${editing.id}`), payload)
        setRows((prev) => prev.map((r) => (r.id === data.id ? data : r)))
        notify("Agent updated")
      } else {
        const { data } = await axios.post(api("/agents"), payload)
        setRows((prev) => [...prev, data])
        notify("Agent created")
      }
    } catch (err) {
      console.error(err)
      notify("Save failed")
    } finally {
      setBusyId(null)
      setOpenDialog(false)
      setEditing(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      setBusyId(id)
      await axios.delete(api(`/agents/${id}`))
      setRows((prev) => prev.filter((r) => r.id !== id))
      notify("Agent deleted")
    } catch (err) {
      console.error(err)
      notify("Delete failed")
    } finally {
      setBusyId(null)
      setOpenDeleteId(null)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <Button onClick={() => { setEditing(null); setOpenDialog(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Agent
        </Button>
      </div>

      {message && (
        <div className="text-sm text-center bg-muted py-2 rounded-md border">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <AgentsTable
            rows={rows}
            loading={loading}
            busyId={busyId}
            onEdit={(a) => { setEditing(a); setOpenDialog(true) }}
            onDelete={(id) => setOpenDeleteId(id)}
          />
        </CardContent>
      </Card>

      <AgentDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        saving={busyId != null}
      />

      <DeleteDialog
        open={!!openDeleteId}
        onClose={() => setOpenDeleteId(null)}
        onConfirm={() => handleDelete(openDeleteId)}
        busy={busyId != null}
      />
    </div>
  )
}
