// src/pages/AgentsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../../config/api";

const SEX_OPTIONS = [
  { label: "—", value: null },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export default function AgentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  // dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null); // agent object or null

  const [openDeleteId, setOpenDeleteId] = useState(null);

  const toast = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 2500);
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(api("/agents"));
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setRows(data || []);
    } catch (e) {
      toast(e.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setOpenDialog(true);
  };

  const handleEdit = (agent) => {
    setEditing(agent);
    setOpenDialog(true);
  };

  const handleSave = async (payload) => {
    // payload: { name, description, age, sex }
    try {
      if (editing) {
        setBusyId(editing.id);
        const res = await fetch(api(`/agents/${editing.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
        const updated = await res.json();
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast("Agent updated");
      } else {
        const res = await fetch(api("/agents"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
        const created = await res.json();
        setRows((prev) => [...prev, created]);
        toast("Agent created");
      }
    } catch (e) {
      toast(e.message || "Save failed");
    } finally {
      setBusyId(null);
      setOpenDialog(false);
      setEditing(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setBusyId(id);
      const res = await fetch(api(`/agents/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast("Agent deleted");
    } catch (e) {
      toast(e.message || "Delete failed");
    } finally {
      setBusyId(null);
      setOpenDeleteId(null);
    }
  };

  const Actions = useMemo(
    () =>
      function Actions({ row }) {
        const isBusy = busyId === row.id;
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(row)}
                  disabled={isBusy}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setOpenDeleteId(row.id)}
                  disabled={isBusy}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    [busyId]
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Agents</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={handleCreate}
        >
          Add Agent
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell width={120}>Age</TableCell>
              <TableCell width={140}>Sex</TableCell>
              <TableCell width={120} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={22} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No agents yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name ?? ""}</TableCell>
                  <TableCell sx={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.description ?? ""}
                  </TableCell>
                  <TableCell>{row.age ?? ""}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {row.sex ?? ""}
                  </TableCell>
                  <TableCell align="right">
                    <Actions row={row} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit dialog */}
      <AgentDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
        saving={busyId != null}
      />

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(openDeleteId)} onClose={() => setOpenDeleteId(null)}>
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this agent?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDelete(openDeleteId)}
            disabled={busyId != null}
          >
            {busyId != null ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(error)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/** Agent create/edit dialog */
function AgentDialog({ open, onClose, onSave, initial, saving }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [age, setAge] = useState(initial?.age ?? "");
  const [sex, setSex] = useState(initial?.sex ?? null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setAge(initial?.age ?? "");
    setSex(initial?.sex ?? null);
    setErrors({});
  }, [initial, open]);

  const validate = () => {
    const errs = {};
    if (!name?.trim()) errs.name = "Name is required";
    if (age !== "" && (isNaN(Number(age)) || Number(age) < 0)) {
      errs.age = "Age must be a non-negative number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      description: description?.trim() || null,
      age: age === "" ? null : Number(age),
      sex: sex || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Agent" : "Add Agent"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            autoFocus
            fullWidth
          />
          <TextField
            label="Description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Age"
            value={age ?? ""}
            onChange={(e) => setAge(e.target.value)}
            error={Boolean(errors.age)}
            helperText={errors.age}
            fullWidth
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />
          <TextField
            select
            label="Sex"
            value={sex ?? ""}
            onChange={(e) => setSex(e.target.value || null)}
            fullWidth
          >
            {SEX_OPTIONS.map((opt) => (
              <MenuItem key={String(opt.value)} value={opt.value ?? ""}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
