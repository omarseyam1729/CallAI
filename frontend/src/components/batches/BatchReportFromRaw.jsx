// src/components/batches/BatchReportFromRaw.jsx
import React, { useMemo } from "react";
import {
  Card, CardContent, Typography, Grid, Chip, Table, TableHead, TableRow, TableCell, TableBody, Box
} from "@mui/material";
import { normalizeBatchResult } from "../../utils/batchReport";

export default function BatchReportFromRaw({ raw }) {
  const report = useMemo(() => normalizeBatchResult(raw), [raw]);

  const t = report.totals || { calls: 0, triggers: 0, evaluations: 0, matches: 0 };

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Batch #{report.batch_id} • {report.status}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item><Chip label={`Calls: ${t.calls}`} /></Grid>
          <Grid item><Chip label={`Triggers: ${t.triggers}`} /></Grid>
          <Grid item><Chip label={`Evaluations: ${t.evaluations}`} /></Grid>
          <Grid item><Chip color="success" label={`Matches: ${t.matches}`} /></Grid>
        </Grid>

        {/* Matches by Trigger */}
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Matches by Trigger</Typography>
        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Trigger ID</TableCell>
              <TableCell align="right">Evaluated</TableCell>
              <TableCell align="right">Matches</TableCell>
              <TableCell align="right">Match Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.by_trigger.map(row => (
              <TableRow key={row.trigger_id}>
                <TableCell>#{row.trigger_id}</TableCell>
                <TableCell align="right">{row.evaluated}</TableCell>
                <TableCell align="right">{row.matches}</TableCell>
                <TableCell align="right">{Math.round(row.match_rate * 100)}%</TableCell>
              </TableRow>
            ))}
            {report.by_trigger.length === 0 && (
              <TableRow><TableCell colSpan={4}><Box sx={{ color: "text.secondary" }}>No trigger evaluations.</Box></TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Matches by Call */}
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Matches by Call</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Call ID</TableCell>
              <TableCell align="right">Evaluated</TableCell>
              <TableCell align="right">Matches</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.by_call.map(row => (
              <TableRow key={row.call_id}>
                <TableCell sx={{ fontFamily: "monospace" }}>{row.call_id}</TableCell>
                <TableCell align="right">{row.evaluated}</TableCell>
                <TableCell align="right">{row.matches}</TableCell>
              </TableRow>
            ))}
            {report.by_call.length === 0 && (
              <TableRow><TableCell colSpan={3}><Box sx={{ color: "text.secondary" }}>No calls.</Box></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
