import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  TextField, Typography, Box, Divider, Button, CircularProgress,
} from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ResultCard from "./ResultCard";

export default function EvaluateDialog({
  open, onClose, triggerCount, onRun, running, results,
}) {
  const [callId, setCallId] = useState("");

  const run = () => onRun(callId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Evaluate Trigger{triggerCount > 1 ? "s" : ""} on Call</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="call_id"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            fullWidth
            placeholder="e.g. f5ec5fcd-a7a0-461b-9075-975d67575b02"
          />
          <Typography variant="body2" color="text.secondary">
            Evaluating {triggerCount} trigger{triggerCount > 1 ? "s" : ""}.
          </Typography>

          {running && (
            <Box py={2} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          )}

          {results && !running && (
            <Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle1" gutterBottom>Results</Typography>
              {!Array.isArray(results) ? (
                <ResultCard r={results} />
              ) : (
                <Stack spacing={1.5}>
                  {results.map((r, idx) => <ResultCard key={`${r.trigger_id}-${idx}`} r={r} />)}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={run}
          startIcon={<PlayCircleIcon />}
          disabled={running}
        >
          Run
        </Button>
      </DialogActions>
    </Dialog>
  );
}
