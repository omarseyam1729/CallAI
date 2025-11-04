import React from "react";
import { Card, CardContent, Stack, Typography, Chip, Divider } from "@mui/material";

export default function ResultCard({ r }) {
  const matched = !!r?.matched;
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">
              Trigger #{r.trigger_id} — {r.trigger_name || "(unnamed)"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              call_id: {r.call_id}
            </Typography>
          </Stack>
          <Chip
            label={matched ? "Matched" : "No match"}
            color={matched ? "success" : "default"}
            variant={matched ? "filled" : "outlined"}
          />
        </Stack>

        {typeof r.score !== "undefined" && r.score !== null && (
          <Typography variant="body2" sx={{ mt: 1 }}>score: {r.score}</Typography>
        )}

        {r?.evidence && (
          <>
            <Divider sx={{ my: 1.25 }} />
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <strong>evidence:</strong>{" "}
              {formatEvidence(r.evidence)}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatEvidence(ev) {
  try {
    if (ev.pattern || ev.criteria_text) {
      const parts = [];
      if (ev.pattern) parts.push(`pattern="${ev.pattern}"`);
      if (ev.criteria_text) parts.push(`criteria_text="${ev.criteria_text}"`);
      if (ev.span) parts.push(`span=[${ev.span.join(", ")}]`);
      if (ev.text_snippet) parts.push(`snippet: ${ev.text_snippet}`);
      if (ev.reasoning) parts.push(`reasoning: ${ev.reasoning}`);
      if (ev.warning) parts.push(`warning: ${ev.warning}`);
      return parts.join("\n");
    }
    return JSON.stringify(ev, null, 2);
  } catch {
    return String(ev);
  }
}
