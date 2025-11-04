// src/components/batches/AttachDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

export default function AttachDialog({ 
  open, 
  onClose, 
  onSubmit, 
  label = "IDs", 
  placeholder = "comma,separated,ids",
  parse = (s)=>s.split(",").map(x=>x.trim()).filter(Boolean) 
}) {
  const [ids, setIds] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    await onSubmit(parse(ids));
    setSaving(false);
    onClose();
  };
  useEffect(()=>{ if(!open) setIds(""); },[open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Attach {label}</DialogTitle>
      <DialogContent>
        <TextField
          label={`${label} (comma-separated)`}
          value={ids}
          onChange={e=>setIds(e.target.value)}
          fullWidth multiline minRows={3}
          sx={{ mt: 1 }}
          placeholder={placeholder}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handle} disabled={saving} variant="contained">Attach</Button>
      </DialogActions>
    </Dialog>
  );
}
