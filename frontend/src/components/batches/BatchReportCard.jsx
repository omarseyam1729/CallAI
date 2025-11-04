// src/components/batches/BatchReportCard.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Grid, Chip, Box, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { getBatchReport, getBatchProgress } from "../../api/batches";

export default function BatchReportCard({ batchId, autoPoll = true, pollMs = 1500 }) {
  const [progress, setProgress] = useState(null);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let t;
    const tick = async () => {
      try {
        const p = await getBatchProgress(batchId);
        setProgress(p);
        if (p?.status === "completed" || p?.done === true) {
          const r = await getBatchReport(batchId);
          setReport(r);
          if (t) clearInterval(t);
        }
      } catch (e) {
        setErr(String(e));
        if (t) clearInterval(t);
      }
    };
    tick();
    if (autoPoll) t = setInterval(tick, pollMs);
    return () => t && clearInterval(t);
  }, [batchId, autoPoll, pollMs]);

  if (err) return <Alert severity="error">{err}</Alert>;

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Batch Report</Typography>

        {/* Progress */}
        {!report && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary" }}>
            <CircularProgress size={22} />
            <Typography variant="body2">
              {progress?.status ? `Processing: ${progress.status}` : "Waiting for completion…"}
            </Typography>
          </Box>
        )}

        {/* Totals */}
        {report?.totals && (
          <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
            <Grid item><Chip label={`Calls: ${report.totals.calls ?? 0}`} /></Grid>
            <Grid item><Chip label={`Triggers: ${report.totals.triggers ?? 0}`} /></Grid>
            <Grid item><Chip label={`Evaluations: ${report.totals.evaluations ?? 0}`} /></Grid>
            <Grid item color="success.main"><Chip color="success" label={`Matches: ${report.totals.matches ?? 0}`} /></Grid>
          </Grid>
        )}

        {/* By Trigger */}
        {Array.isArray(report?.by_trigger) && report.by_trigger.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>Matches by Trigger</Typography>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Trigger</TableCell>
                  <TableCell align="right">Evaluated</TableCell>
                  <TableCell align="right">Matches</TableCell>
                  <TableCell align="right">Match Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.by_trigger.map((t) => (
                  <TableRow key={t.trigger_id}>
                    <TableCell>{t.name || `#${t.trigger_id}`} {t.type ? `· ${t.type}` : ""}</TableCell>
                    <TableCell align="right">{t.evaluated ?? 0}</TableCell>
                    <TableCell align="right">{t.matches ?? 0}</TableCell>
                    <TableCell align="right">
                      {typeof t.match_rate === "number" ? `${Math.round(t.match_rate * 100)}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* By Call (optional) */}
        {Array.isArray(report?.by_call) && report.by_call.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>Matches by Call</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Call ID</TableCell>
                  <TableCell align="right">Evaluated</TableCell>
                  <TableCell align="right">Matches</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.by_call.slice(0, 30).map((c) => (
                  <TableRow key={c.call_id}>
                    <TableCell sx={{ fontFamily: "monospace" }}>{c.call_id}</TableCell>
                    <TableCell align="right">{c.evaluated ?? 0}</TableCell>
                    <TableCell align="right">{c.matches ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {report.by_call.length > 30 && (
              <Typography variant="caption" color="text.secondary">+ {report.by_call.length - 30} more…</Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
