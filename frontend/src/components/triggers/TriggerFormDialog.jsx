import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, MenuItem,
  Divider, Typography, FormControlLabel, Switch, Button
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";

const EMPTY_REGEX = { pattern: "", case_sensitive: false };
const EMPTY_SEM = { criteria_text: "" };

export default function TriggerFormDialog({ open, onClose, trigger, onSave }) {
  const [form, setForm] = useState({
    name: "",
    type: "regex",
    description: "",
    config: { ...EMPTY_REGEX },
  });

  useEffect(() => {
    if (!trigger) {
      setForm({ name: "", type: "regex", description: "", config: { ...EMPTY_REGEX } });
    } else {
      setForm({
        name: trigger.name ?? "",
        type: trigger.type ?? "regex",
        description: trigger.description ?? "",
        config:
          (trigger.type ?? "regex") === "regex"
            ? { pattern: trigger?.config?.pattern ?? "", case_sensitive: !!trigger?.config?.case_sensitive }
            : { criteria_text: trigger?.config?.criteria_text ?? "" },
      });
    }
  }, [trigger, open]);

  const isRegex = form.type === "regex";

  const save = () => {
    // minimal validation aligned to backend rules
    if (!form.name.trim()) return;
    if (isRegex && !form.config.pattern.trim()) return;
    if (!isRegex && !form.config.criteria_text.trim()) return;

    const payload = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      config: isRegex
        ? { pattern: form.config.pattern, case_sensitive: !!form.config.case_sensitive }
        : { criteria_text: form.config.criteria_text },
    };

    onSave(payload, trigger?.id || null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{trigger ? "Edit Trigger" : "New Trigger"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
          <TextField select label="Type" value={form.type} onChange={(e) => {
            const nextType = e.target.value;
            setForm((f) => ({
              ...f,
              type: nextType,
              config: nextType === "regex" ? { ...EMPTY_REGEX } : { ...EMPTY_SEM },
            }));
          }} fullWidth>
            <MenuItem value="regex">Regex</MenuItem>
            <MenuItem value="semantic">Semantic</MenuItem>
          </TextField>
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth multiline minRows={2}
          />

          {isRegex ? (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Regex Config</Typography>
              <TextField
                label="pattern"
                value={form.config.pattern}
                onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, pattern: e.target.value } }))}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.config.case_sensitive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, config: { ...f.config, case_sensitive: e.target.checked } }))
                    }
                  />
                }
                label="Case sensitive"
              />
            </>
          ) : (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Semantic Config</Typography>
              <TextField
                label="criteria_text"
                value={form.config.criteria_text}
                onChange={(e) => setForm((f) => ({ ...f, config: { criteria_text: e.target.value } }))}
                fullWidth multiline minRows={2}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<DoDisturbIcon />}>Cancel</Button>
        <Button variant="contained" onClick={save} startIcon={<CheckCircleIcon />}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
