// src/pages/Triggers.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Container, Typography, Stack, Button, Snackbar, Alert, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";

import TriggerList from "../../components/triggers/TriggerList";
import useTriggersApi from "../../components/Triggers/useTriggersApi";
import TriggerFormDialog from "../../components/triggers/TriggerFormDialog";
import EvaluateDialog from "../../components/triggers/EvaluateDialog";

export default function Triggers() {
  const {
    list, loading, error, fetchTriggers,
    createTrigger, updateTrigger, deleteTrigger,
    evalSingle, evalMultiple,
  } = useTriggersApi();

  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  const [selected, setSelected] = useState([]);
  const [openCE, setOpenCE] = useState(false);
  const [editing, setEditing] = useState(null);

  const [evalOpen, setEvalOpen] = useState(false);
  const [evalIds, setEvalIds] = useState([]);
  const [evalResults, setEvalResults] = useState(null);
  const [evalRunning, setEvalRunning] = useState(false);

  useEffect(() => { fetchTriggers(); }, []); // eslint-disable-line

  const allSelected = useMemo(
    () => selected.length && selected.length === list.length,
    [selected, list]
  );

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => setSelected(allSelected ? [] : list.map((t) => t.id));

  const handleCreate = () => { setEditing(null); setOpenCE(true); };
  const handleEdit = (t) => { setEditing(t); setOpenCE(true); };

  const handleSave = async (payload, editingId) => {
    try {
      if (editingId) await updateTrigger(editingId, payload);
      else await createTrigger(payload);
      setOpenCE(false);
      setSnack({ open: true, msg: editingId ? "Trigger updated" : "Trigger created", sev: "success" });
      await fetchTriggers();
    } catch (e) {
      setSnack({ open: true, msg: e.message || "Save failed", sev: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTrigger(id);
      setSnack({ open: true, msg: "Trigger deleted", sev: "success" });
      await fetchTriggers();
    } catch (e) {
      setSnack({ open: true, msg: e.message || "Delete failed", sev: "error" });
    }
  };

  const openEvalSingle = (id) => { setEvalIds([Number(id)]); setEvalResults(null); setEvalOpen(true); };
  const openEvalMultiple = () => {
    if (!selected.length) {
      setSnack({ open: true, msg: "Select at least one trigger", sev: "warning" });
      return;
    }
    setEvalIds(selected.map(Number));
    setEvalResults(null);
    setEvalOpen(true);
  };

  const runEvaluate = async (callId) => {
    if (!callId?.trim()) {
      setSnack({ open: true, msg: "Provide a call_id", sev: "error" });
      return;
    }
    try {
      setEvalRunning(true);
      if (evalIds.length === 1) {
        const data = await evalSingle(evalIds[0], callId.trim());
        setEvalResults(data);
      } else {
        const data = await evalMultiple(evalIds.map(Number), callId.trim());
        setEvalResults(data);
      }
    } catch (e) {
      setSnack({ open: true, msg: e.message || "Evaluation error", sev: "error" });
    } finally {
      setEvalRunning(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">My Triggers</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={toggleSelectAll}>
            {allSelected ? "Unselect All" : "Select All"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<PlayCircleIcon />}
            onClick={openEvalMultiple}
          >
            Evaluate Selected
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate}>
            New Trigger
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Box py={6} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TriggerList
        items={list}
        selected={selected}
        onToggleSelect={toggleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onEvaluate={openEvalSingle}
      />

      {!loading && !list.length && (
        <Alert severity="info" sx={{ mt: 2 }}>No triggers yet. Create one to get started.</Alert>
      )}

      <TriggerFormDialog
        open={openCE}
        onClose={() => setOpenCE(false)}
        trigger={editing}
        onSave={handleSave}
      />

      <EvaluateDialog
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        triggerCount={evalIds.length}
        onRun={runEvaluate}
        running={evalRunning}
        results={evalResults}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
