import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Typography, Button, CircularProgress
} from "@mui/material";

export default function EditCallDialog({
  open,
  loading,
  saving,
  error,
  form,
  setForm,
  onClose,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Edit Call</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Call name"
              value={form.call_name}
              onChange={(e) => setForm((f) => ({ ...f, call_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.call_description}
              onChange={(e) => setForm((f) => ({ ...f, call_description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Agent ID"
              value={form.agent_id}
              onChange={(e) => setForm((f) => ({ ...f, agent_id: e.target.value }))}
              fullWidth
              placeholder="Leave blank to unset"
            />
            {!!error && (
              <Typography color="error" variant="body2">{error}</Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={onSave} disabled={loading || saving} variant="contained">
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
