// src/pages/CallDetails.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  LinearProgress,
  Alert,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../config/api";

// split components
import CallSummary from "../../components/CallExplorer/CallSummary";
import CallTranscript from "../../components/CallExplorer/CallTranscript";
import CallMetrics from "../../components/CallExplorer/CallMetrics"; // your existing full component

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function CallDetails() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);

  // call data state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // metrics state
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsErr, setMetricsErr] = useState("");

  // reset metrics whenever call changes
  useEffect(() => {
    setMetrics(null);
    setMetricsErr("");
    setMetricsLoading(false);
  }, [id]);

  // fetch call data
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const resp = await fetch(api(`/call/${id}/data`), {
          credentials: "include",
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status} ${txt || ""}`.trim());
        }
        const json = await resp.json();
        if (alive) setData(json);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load call data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // lazy fetch metrics (only when tab 2 is opened)
  useEffect(() => {
    let alive = true;
    if (tab !== 2 || metrics) return;
    (async () => {
      setMetricsLoading(true);
      setMetricsErr("");
      try {
        const resp = await fetch(api(`/calls/${id}/metrics`), {
          credentials: "include",
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status} ${txt || ""}`.trim());
        }
        const json = await resp.json();
        if (alive) setMetrics(json);
      } catch (e) {
        if (alive) setMetricsErr(e?.message || "Failed to load metrics.");
      } finally {
        if (alive) setMetricsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, tab, metrics]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Call {id}
      </Typography>

      <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Summary" />
          <Tab label="Transcript" />
          <Tab label="Metrics" />
        </Tabs>

        {/* loading/error state */}
        {loading && (
          <Stack sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="caption"
              sx={{ mt: 1, opacity: 0.7 }}
            >
              Loading…
            </Typography>
          </Stack>
        )}
        {!loading && err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

        {/* Summary tab */}
        <TabPanel value={tab} index={0}>
          {!loading && !err && <CallSummary data={data} />}
        </TabPanel>

        {/* Transcript tab */}
        <TabPanel value={tab} index={1}>
          {!loading && !err && (
            <CallTranscript transcript={data?.full_transcript} />
          )}
        </TabPanel>

        {/* Metrics tab */}
        <TabPanel value={tab} index={2}>
          {metricsLoading && (
            <Stack sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography
                variant="caption"
                sx={{ mt: 1, opacity: 0.7 }}
              >
                Loading metrics…
              </Typography>
            </Stack>
          )}
          {!metricsLoading && metricsErr && (
            <Alert severity="error" sx={{ mt: 2 }}>{metricsErr}</Alert>
          )}
          {!metricsLoading && !metricsErr && metrics && (
            <CallMetrics metrics={metrics} />
          )}
          {!metricsLoading && !metricsErr && !metrics && (
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>
              No metrics available.
            </Typography>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}
