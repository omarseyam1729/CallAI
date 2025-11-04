// src/pages/Batches.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Container, Stack, Typography, Button, Card, CardContent,
  CircularProgress, IconButton, Chip, Tooltip, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../config/api";
import CreateBatchWizardSimple from "./CreateBatchWizardSimple";

const StatusChip = ({ status }) => (
  <Chip
    size="small"
    label={status}
    color={
      status === "succeeded" ? "success" :
      status === "failed"    ? "error" :
      status === "running"   ? "warning" :
      "default"
    }
    variant="outlined"
  />
);

export default function Batches() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(params.get("create") === "1");

  const load = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const res = await fetch(api("/batch/"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems(await res.json());
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // keep URL in sync with wizard open state (so topbar ?create=1 works)
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (openCreate) {
      next.set("create", "1");
    } else {
      next.delete("create");
    }
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreate]);

  const startBatch = async (id) => {
    try {
      const res = await fetch(api(`/batch/${id}/start`), { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
      nav(`/batches/${id}`);
    } catch (e) {
      setErr(String(e));
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      const res = await fetch(api(`/batch/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Batches</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenCreate(true)}>
          New Batch
        </Button>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : items && items.length > 0 ? (
        <Stack spacing={2}>
          {items.map(b => (
            <Card key={b.id} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" fontWeight={600}>{b.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip status={b.status} />
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Open">
                      <IconButton onClick={() => nav(`/batches/${b.id}`)}><OpenInNewIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Start">
                      <span>
                        <IconButton onClick={() => startBatch(b.id)} disabled={b.status !== "draft"}>
                          <PlayArrowIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => deleteBatch(b.id)}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>No batches yet.</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenCreate(true)}>
            Create your first batch
          </Button>
        </Box>
      )}

      {/* Simple 3-step wizard: Calls → Triggers → Basics */}
      <CreateBatchWizardSimple
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(batch) => {
          setOpenCreate(false);
          load();
          nav(`/batches/${batch.id}`);
        }}
      />
    </Container>
  );
}
