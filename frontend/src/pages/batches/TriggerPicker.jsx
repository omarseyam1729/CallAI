import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer, Box, Stack, TextField, List, ListItemButton, ListItemText,
  Checkbox, Chip, Typography, Divider, CircularProgress, Alert
} from "@mui/material";
import { listTriggers } from "../../api/triggers";

export default function TriggerPicker({
  open, onClose, selected, setSelected, width = 360
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    const run = async () => {
      setErr(""); setLoading(true);
      try {
        const data = await listTriggers(q);
        if (!ignore) setItems(data || []);
      } catch (e) {
        if (!ignore) setErr(String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [open, q]);

  const toggle = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const clearAll = () => setSelected([]);

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width } }}>
      <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom>Triggers</Typography>
        <TextField
          size="small"
          placeholder="Filter triggers..."
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: "wrap" }}>
          {selected.map((id) => (
            <Chip key={id} label={`#${id}`} onDelete={() => toggle(id)} />
          ))}
          {selected.length > 0 && (
            <Chip label="Clear" variant="outlined" onClick={clearAll} />
          )}
        </Stack>

        <Divider sx={{ my: 1 }} />
        {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}
        {loading ? (
          <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <List dense sx={{ overflow: "auto" }}>
            {(items || []).map((t) => (
              <ListItemButton
                key={t.id}
                onClick={() => toggle(t.id)}
                selected={selected.includes(t.id)}
              >
                <Checkbox size="small" checked={selected.includes(t.id)} tabIndex={-1} disableRipple />
                <ListItemText
                  primary={`${t.name || `Trigger ${t.id}`}`}
                  secondary={`#${t.id} · ${t.type || "unknown"}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
