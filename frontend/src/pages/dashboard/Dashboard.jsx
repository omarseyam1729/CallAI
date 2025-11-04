import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Grid, Typography, Stack, Alert, useTheme, useMediaQuery } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import SplitscreenIcon from "@mui/icons-material/Splitscreen";
import ArticleIcon from "@mui/icons-material/Article";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BoltIcon from "@mui/icons-material/Bolt";

import { api } from "../../config/api";
import { StatCard, StatSkeleton } from "../../components/dashboard/StatCard";
import ProgressCard from "../../components/dashboard/ProgressCard";
import DashboardCharts from "../../components/dashboard/DashboardCharts";

export default function Dashboard() {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(api("/metrics"));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setData(json);
      } catch {
        if (alive) setErr("Failed to load metrics.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const kpis = useMemo(() => [
    { label: "Total Calls", value: data?.total_calls, icon: <CallIcon fontSize="small" /> },
    { label: "Segments", value: data?.total_segments, icon: <SplitscreenIcon fontSize="small" /> },
    { label: "Words", value: data?.total_words, icon: <ArticleIcon fontSize="small" /> },
    { label: "Duration", value: data?.total_duration_sec, icon: <AccessTimeIcon fontSize="small" /> },
    { label: "Completed Chunks", value: data?.completed_chunks, icon: <CheckCircleIcon fontSize="small" /> },
    { label: "Pending Chunks", value: data?.pending_chunks, icon: <HourglassEmptyIcon fontSize="small" /> },
    { label: "Triggers (total)", value: data?.total_triggers, icon: <BoltIcon fontSize="small" /> },
    { label: "Trigger Evals", value: data?.total_trigger_evals, icon: <CheckCircleIcon fontSize="small" /> },
  ], [data]);

  const processingPct = useMemo(() => {
    const completed = data?.completed_chunks ?? 0;
    const pending = data?.pending_chunks ?? 0;
    const total = completed + pending;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [data]);

  const sentiments = useMemo(() =>
    Object.entries(data?.sentiments || {}).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0), [data]
  );

  const emotions = useMemo(() =>
    Object.entries(data?.emotions || {}).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0), [data]
  );

  const triggerPieData = useMemo(() => [
    { name: "Matched", value: data?.triggers_matched ?? 0 },
    { name: "Unmatched", value: data?.triggers_unmatched ?? 0 },
  ], [data]);

  const generatedOn = useMemo(() => {
    if (!data?.generated_at) return "";
    return new Date(data.generated_at).toLocaleString();
  }, [data]);

  const chartHeight = downSm ? 260 : downMd ? 320 : 360;

return (
  <Box
    sx={{
      flex: 1,
      width: "100%",
      minHeight: "100vh",
      bgcolor: "background.default",
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 2, md: 4 },
    }}
  >
    {/* Header */}
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      mb={3}
    >
      <Typography variant="h4" fontWeight={600}>
        Dashboard
      </Typography>
      {generatedOn && (
        <Typography variant="body2" color="text.secondary">
          Generated on: <b>{generatedOn}</b>
        </Typography>
      )}
    </Stack>

    {/* Error */}
    {!loading && err && (
      <Alert severity="error" sx={{ mb: 3 }}>
        {err}
      </Alert>
    )}

    {/* KPIs */}
    {!loading && data && (
      <>
        <Grid container spacing={3} mb={4}>
          {kpis.map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={3}>
              <StatCard {...item} />
            </Grid>
          ))}
        </Grid>
        {/* Progress */}
        <Box mb={4}>
          <ProgressCard progress={processingPct} />
        </Box>

        {/* Charts */}
        <DashboardCharts
          sentiments={sentiments}
          emotions={emotions}
          triggerPieData={triggerPieData}
          totalEvals={data?.total_trigger_evals}
          totalTriggers={data?.total_triggers}
          chartHeight={chartHeight}
          downSm={downSm}
        />
      </>
    )}
  </Box>
);

}
