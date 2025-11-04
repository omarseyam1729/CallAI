import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Stack, Typography, Card, CardContent, Chip, Divider,
  Box, CircularProgress, Alert, Link, Tooltip, IconButton, Button
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ResultCard from "../../components/triggers/ResultCard";
import { api } from "../../config/api";

export default function TriggerEvaluations() {
  const { id } = useParams(); // trigger id
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [triggerName, setTriggerName] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      // get trigger (for name)
      const tRes = await fetch(api(`/triggers/${id}`));
      const trig = await tRes.json();
      if (!tRes.ok) throw new Error(trig?.detail || `Failed to load trigger (HTTP ${tRes.status})`);
      setTriggerName(trig?.name || `#${id}`);

      // get evaluations
      const eRes = await fetch(api(`/triggers/${id}/evaluations?limit=200`));
      const data = await eRes.json();
      if (!eRes.ok) throw new Error(data?.detail || `Failed to load evaluations (HTTP ${eRes.status})`);
      setRows(data || []);
      setErr("");
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button component={RouterLink} to="/triggers" startIcon={<ArrowBackIcon />}>
            Back to Triggers
          </Button>
          <Typography variant="h5">Evaluations — {triggerName}</Typography>
        </Stack>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchAll}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {loading && (
        <Box py={6} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      )}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Stack spacing={2}>
        {rows.map((r, idx) => (
          <Card key={`${r.call_id}-${idx}`} variant="outlined">
            <CardContent>
              {/* Top row with call link and match chip */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0.3}>
                  <Typography variant="subtitle2">Trigger #{r.trigger_id} — {r.trigger_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    call_id:{" "}
                    <Link component={RouterLink} to={`/calls/${r.call_id}`} underline="hover">
                      {r.call_id}
                    </Link>
                  </Typography>
                </Stack>
                <Chip
                  label={r.matched ? "Matched" : "No match"}
                  color={r.matched ? "success" : "default"}
                  variant={r.matched ? "filled" : "outlined"}
                />
              </Stack>

              {/* Optional score + evidence */}
              {typeof r.score !== "undefined" && r.score !== null && (
                <Typography variant="body2" sx={{ mt: 1 }}>score: {r.score}</Typography>
              )}

              {r?.evidence && (
                <>
                  <Divider sx={{ my: 1.25 }} />
                  {/* Reuse the same pretty evidence UI via ResultCard formatting if you want;
                      or embed your formatter here. */}
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    <strong>evidence:</strong>{" "}
                    {formatEvidence(r.evidence)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {!loading && !rows.length && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No evaluations found for this trigger yet. Try running an evaluation from the Triggers page.
        </Alert>
      )}
    </Container>
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
