// src/pages/batches/CreateBatchWizardSimple.jsx
// (Your file, minimal edits + one extra step)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, AppBar, Toolbar, IconButton, Typography, Button, Box, Stack,
  Stepper, Step, StepLabel, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Checkbox, Chip, Divider, CircularProgress, Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

import { createBatch, attachCalls, attachTriggers, startBatch } from "../../api/batches";
import { searchCalls } from "../../api/calls";
import { listTriggers } from "../../api/triggers";
import BatchReportCard from "../../components/batches/BatchReportCard";

// ───────── helpers (same as you had) ─────────
const safeJSON = (s) => { try { return JSON.parse(s || "{}"); } catch { return null; } };
const uniq = (arr) => Array.from(new Set(arr.map(String)));
const resolveCallId = (row) => {
  const id = row?.call_id ?? row?.callId ?? row?.id ?? row?.uuid ?? row?.pk ?? row?.uid ?? null;
  return id == null ? null : String(id);
};
const extractSnippet = (row) => {
  const raw = row?.snippet ?? row?.preview ?? row?.transcript ?? row?.transcription ?? row?.text ?? row?.content ?? "";
  const normalized = String(raw).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const sentences = normalized.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const s = sentences || normalized;
  const MAX = 220;
  return s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s;
};
const dedupeBy = (arr, keyFn) => {
  const seen = new Set(); const out = [];
  for (const it of arr) { const k = keyFn(it); if (k != null && !seen.has(k)) { seen.add(k); out.push(it); } }
  return out;
};
function useDebouncedCallback(fn, delay = 300) {
  const t = useRef(); return (...args) => { clearTimeout(t.current); t.current = setTimeout(() => fn(...args), delay); };
}

// ───────── Calls Panel (same as yours) ─────────
function CallsPanel({ selected, setSelected }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const runSearch = useCallback(async (query) => {
    setErr(""); setLoading(true);
    try {
      const data = await searchCalls(query || "");
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      const normalized = list.map(r => ({ ...r, __id: resolveCallId(r), __snippet: extractSnippet(r) })).filter(r => r.__id);
      setItems(dedupeBy(normalized, r => r.__id));
    } catch (e) { setErr(String(e)); } finally { setLoading(false); }
  }, []);

  const debounced = useDebouncedCallback(runSearch, 300);
  useEffect(() => { runSearch(""); }, [runSearch]);

  const toggle = (id) => {
    const s = String(id);
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : uniq([...prev, s]));
  };

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Semantic search"
        placeholder="Type to search calls..."
        value={q}
        onChange={(e)=>{ setQ(e.target.value); debounced(e.target.value); }}
        onKeyDown={(e)=>{ if (e.key === "Enter") runSearch(e.currentTarget.value); }}
        InputProps={{ endAdornment:
          <InputAdornment position="end">
            <IconButton size="small" onClick={()=>runSearch(q)}><SearchIcon /></IconButton>
          </InputAdornment>
        }}
      />
      {err && <Alert severity="error">{err}</Alert>}

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {selected.map(id => (<Chip key={`sel-call-${id}`} label={id} onDelete={() => toggle(id)} sx={{ fontFamily: "monospace" }} />))}
        {selected.length > 0 && (<Chip label="Clear" variant="outlined" onClick={() => setSelected([])} />)}
      </Stack>

      <Divider />
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}><CircularProgress /></Box>
      ) : (
        <List dense sx={{ maxHeight: 360, overflow: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 1 }}>
          {items.length === 0 && (<Box sx={{ p: 2, color: "text.secondary" }}>No results yet — try a different query.</Box>)}
          {items.map(row => {
            const id = row.__id; const checked = selected.includes(id);
            return (
              <ListItemButton key={`call-${id}`} onClick={() => toggle(id)} selected={checked}>
                <Checkbox size="small" checked={checked} tabIndex={-1} disableRipple onClick={(e)=>e.stopPropagation()} onChange={() => toggle(id)} />
                <ListItemText
                  primary={<span style={{ fontFamily: "monospace" }}>{id}</span>}
                  secondary={row.__snippet || "No transcript preview available."}
                  secondaryTypographyProps={{ sx: { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal" } }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Stack>
  );
}

// ───────── Triggers Panel (same) ─────────
function TriggersPanel({ selected, setSelected }) {
  const [q, setQ] = useState(""); const [items, setItems] = useState([]); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const data = await listTriggers();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setItems(dedupeBy(arr, t => String(t.id)));
    } catch (e) { setErr(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(t =>
      String(t.id).includes(s) ||
      (t.name || "").toLowerCase().includes(s) ||
      (t.type || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const toggle = (id) => {
    const s = String(id);
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : uniq([...prev, s]));
  };

  return (
    <Stack spacing={2}>
      <TextField size="small" label="Filter triggers" placeholder="Search by id/name/type..." value={q} onChange={(e)=>setQ(e.target.value)} />
      {err && <Alert severity="error">{err}</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {selected.map(id => (<Chip key={`sel-tr-${id}`} label={`#${id}`} onDelete={() => toggle(id)} />))}
        {selected.length > 0 && (<Chip label="Clear" variant="outlined" onClick={() => setSelected([])} />)}
      </Stack>
      <Divider />
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}><CircularProgress /></Box>
      ) : (
        <List dense sx={{ maxHeight: 360, overflow: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 1 }}>
          {filtered.length === 0 && (<Box sx={{ p: 2, color: "text.secondary" }}>No triggers found.</Box>)}
          {filtered.map(t => {
            const id = String(t.id); const checked = selected.includes(id);
            return (
              <ListItemButton key={`tr-${id}`} onClick={() => toggle(id)} selected={checked}>
                <Checkbox size="small" checked={checked} tabIndex={-1} disableRipple onClick={(e)=>e.stopPropagation()} onChange={() => toggle(id)} />
                <ListItemText primary={t.name || `Trigger ${id}`} secondary={`#${id}${t.type ? ` · ${t.type}` : ""}`} />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Stack>
  );
}

// ───────── Review & Run ─────────
function ReviewPanel({ batch, calls, triggers, onStart, starting }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Review</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip label={`Batch #${batch?.id ?? "-"}`} />
        <Chip label={`Calls: ${calls.length}`} />
        <Chip label={`Triggers: ${triggers.length}`} />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Click “Start” to evaluate triggers on the selected calls. A live report will appear below.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={onStart} disabled={!batch?.id || starting}>
          {starting ? "Starting…" : "Start"}
        </Button>
      </Stack>
      {batch?.id && <BatchReportCard batchId={batch.id} />}
    </Stack>
  );
}

// ───────── Wizard ─────────
export default function CreateBatchWizardSimple({ open, onClose, onCreated }) {
  const theme = useTheme();
  const full = useMediaQuery(theme.breakpoints.down("md"));
  const [active, setActive] = useState(0);

  // Step 0: config
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState('{"transcription": true, "sentiment": true}');
  const [failFast, setFailFast] = useState(false);
  const parsedSteps = useMemo(() => safeJSON(steps), [steps]);
  const canCreateBatch = !!name && !!parsedSteps;

  // Saved batch after step 0
  const [batch, setBatch] = useState(null);

  // Step 1: calls
  const [selectedCalls, setSelectedCalls] = useState([]);

  // Step 2: triggers
  const [selectedTriggers, setSelectedTriggers] = useState([]);

  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState("");

  const resetAll = () => {
    setActive(0);
    setName(""); setDescription("");
    setSteps('{"transcription": true, "sentiment": true}');
    setFailFast(false);
    setBatch(null);
    setSelectedCalls([]);
    setSelectedTriggers([]);
    setErr("");
  };

  const handleClose = () => { resetAll(); onClose?.(); };

  // Step 0 → create batch, then proceed to Calls
  const createBatchThenNext = async () => {
    if (batch?.id) { setActive(1); return; }
    if (!canCreateBatch) return;
    setSaving(true); setErr("");
    try {
      const created = await createBatch({
        name,
        description,
        steps: parsedSteps,
        trigger_ids: [], // attach later
        fail_fast: !!failFast,
      });
      setBatch(created); // { id, ... }
      setActive(1);
    } catch (e) { setErr(String(e)); }
    finally { setSaving(false); }
  };

  // Step 2 → attach calls & triggers, then go to Review
  const attachAllThenNext = async () => {
    if (!batch?.id) return;
    setSaving(true); setErr("");
    try {
      const triggerIds = uniq(selectedTriggers).map(Number).filter(Number.isFinite);
      const callIds    = uniq(selectedCalls);
      if (callIds.length)    await attachCalls(batch.id, callIds);
      if (triggerIds.length) await attachTriggers(batch.id, triggerIds);
      setActive(3); // go to Review step
      onCreated?.(batch);
    } catch (e) { setErr(String(e)); }
    finally { setSaving(false); }
  };

  const start = async () => {
    if (!batch?.id) return;
    setStarting(true); setErr("");
    try {
      await startBatch(batch.id);
      // Report card below will poll /progress and then /report automatically.
    } catch (e) { setErr(String(e)); }
    finally { setStarting(false); }
  };

  const next = async () => {
    if (active === 0) return createBatchThenNext();
    if (active === 2) return attachAllThenNext();
    setActive((a) => Math.min(a + 1, 3));
  };
  const back = () => setActive((a) => Math.max(a - 1, 0));

  // Top-right button text/handler
  const topCta =
    active < 2 ? { label: "Next", onClick: next, disabled: saving || (active === 0 && !canCreateBatch) } :
    active === 2 ? { label: "Attach & Review", onClick: attachAllThenNext, disabled: saving } :
    { label: "Close", onClick: handleClose, disabled: false };

  return (
    <Dialog fullScreen={full} open={open} onClose={handleClose} PaperProps={{ sx: { overflow: "hidden" } }}>
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose}><CloseIcon /></IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">Create Batch</Typography>
          <Button color="inherit" disabled={topCta.disabled} onClick={topCta.onClick}>
            {saving ? (active === 0 ? "Saving..." : "Working...") : topCta.label}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, height: "calc(100vh - 64px)", overflow: "auto" }}>
        <Stack spacing={3} maxWidth={900} mx="auto">
          <Stepper activeStep={active} alternativeLabel>
            <Step><StepLabel>Config</StepLabel></Step>
            <Step><StepLabel>Select Calls</StepLabel></Step>
            <Step><StepLabel>Select Triggers</StepLabel></Step>
            <Step><StepLabel>Review & Run</StepLabel></Step>
          </Stepper>

          {err && <Alert severity="error">{err}</Alert>}

          {active === 0 && (
            <ConfigPanel
              name={name} setName={setName}
              description={description} setDescription={setDescription}
              steps={steps} setSteps={setSteps}
              failFast={failFast} setFailFast={setFailFast}
              disabled={!!batch?.id} batch={batch}
            />
          )}
          {active === 1 && <CallsPanel selected={selectedCalls} setSelected={setSelectedCalls} />}
          {active === 2 && <TriggersPanel selected={selectedTriggers} setSelected={setSelectedTriggers} />}
          {active === 3 && <ReviewPanel batch={batch} calls={selectedCalls} triggers={selectedTriggers} onStart={start} starting={starting} />}

          <Stack direction="row" justifyContent="space-between">
            <Button disabled={active === 0 || saving} onClick={back}>Back</Button>
            {active < 3 ? (
              <Button variant="contained" onClick={next} disabled={topCta.disabled}>
                {saving && active === 0 ? "Saving..." : topCta.label}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleClose}>Close</Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  );
}

// --- ConfigPanel from your original (unchanged) ---
function ConfigPanel({ name, setName, description, setDescription, steps, setSteps, failFast, setFailFast, disabled, batch }) {
  const parsed = safeJSON(steps);
  return (
    <Stack spacing={2} maxWidth={720}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h6">Batch configuration</Typography>
        {batch?.id && <Chip size="small" label={`Saved • #${batch.id}`} color="success" variant="outlined" />}
      </Stack>

      <TextField label="Batch name" value={name} onChange={(e)=>setName(e.target.value)} fullWidth disabled={disabled} />
      <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} fullWidth disabled={disabled} />
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">Fail fast (stop on first error)</Typography>
        <Button variant={failFast ? "contained" : "outlined"} onClick={()=>!disabled && setFailFast(!failFast)} disabled={disabled}>
          {failFast ? "On" : "Off"}
        </Button>
      </Stack>
    </Stack>
  );
}
