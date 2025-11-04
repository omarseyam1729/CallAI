// src/components/batches/TriggerEvidence.jsx
import { Card, CardContent, Typography, Box } from "@mui/material";
import React from "react";

export default function TriggerEvidence({ t }) {
  return (
    <Card variant="outlined" sx={{ mb:1 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="body2">
          <strong>Trigger #{t.trigger_id}</strong> — {t.matched ? "Matched" : "No match"}
        </Typography>
        {t.evidence && (
          <Box sx={{ whiteSpace: "pre-wrap", fontSize: 13, mt: 0.5 }}>
            {JSON.stringify(t.evidence, null, 2)}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
