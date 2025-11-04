// src/components/CallExplorer/CallMetrics.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Chip,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ForumIcon from "@mui/icons-material/Forum";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import SummarizeIcon from "@mui/icons-material/Summarize";
import InsightsIcon from "@mui/icons-material/Insights";
import BoltIcon from "@mui/icons-material/Bolt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsertLinkIcon from "@mui/icons-material/InsertLink";

// Recharts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/* ========================== utils ========================== */
const nf = new Intl.NumberFormat();

const safeDateLabel = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
};

const timeAgo = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const dys = Math.floor(h / 24);
  if (s < 60) return `${s}s ago`;
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dys}d ago`;
};

const fmtDuration = (sec) => {
  const s = Math.floor(Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}h ${m}m ${r}s`;
  if (m) return `${m}m ${r}s`;
  return `${r}s`;
};

/* ========================== UI atoms ========================== */
const Section = ({ title, subtitle, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      border: (t) => `1px solid ${t.palette.divider}`,
      background: (t) =>
        `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
    }}
  >
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  </Paper>
);

const StatCard = ({ icon, label, value, hint }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      border: (t) => `1px solid ${t.palette.divider}`,
      background: (t) =>
        `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.action.hover} 100%)`,
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: (t) => t.palette.action.hover,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: (t) => `0 1px 2px ${t.palette.action.disabledBackground}`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          {value ?? "—"}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

/* ========================== Header ========================== */
const MetaRow = ({ icon, label, value, action }) => (
  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
    sx={{
      px: 1,
      py: 0.75,
      borderRadius: 1.5,
      bgcolor: (t) => t.palette.action.hover,
    }}
  >
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption" sx={{ opacity: 0.7, minWidth: 70 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
      {value ?? "—"}
    </Typography>
    <Box sx={{ flex: 1 }} />
    {action}
  </Stack>
);

const CallHeader = ({ name, callId, uploadedAt, agentId, triggersHit }) => {
  const [copied, setCopied] = useState(false);
  const abs = safeDateLabel(uploadedAt);
  const rel = timeAgo(uploadedAt);

  const copyBtn =
    callId ? (
      <Tooltip title={copied ? "Copied!" : "Copy ID"}>
        <IconButton
          size="small"
          onClick={() => {
            navigator.clipboard.writeText(String(callId)).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    ) : null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: (t) => `1px solid ${t.palette.divider}`,
        background: (t) =>
          `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
            {name || "Untitled call"}
          </Typography>
          {triggersHit != null && (
            <Chip
              size="small"
              icon={<BoltIcon fontSize="small" />}
              color={Number(triggersHit) > 0 ? "warning" : "default"}
              label={`Triggers hit: ${triggersHit}`}
              sx={{ ml: 0.5 }}
            />
          )}
        </Stack>

        <Stack spacing={1}>
          <MetaRow
            icon={<InsertLinkIcon fontSize="small" />}
            label="Call ID"
            value={callId}
            action={copyBtn}
          />
          <MetaRow
            icon={<AccessTimeIcon fontSize="small" />}
            label="Timestamp"
            value={abs ? `${abs}${rel ? `  •  ${rel}` : ""}` : "—"}
          />
          <MetaRow
            icon={<PersonOutlineIcon fontSize="small" />}
            label="Agent"
            value={agentId != null ? `Agent #${agentId}` : "—"}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

/* ========================== Charts ========================== */
const FancyTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const name = p.name ?? label;
  const val = p.value ?? 0;
  const maybePct = p.payload?.pct != null ? ` (${p.payload.pct}%)` : "";
  return (
    <Paper elevation={3} sx={{ px: 1.25, py: 0.75, borderRadius: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
      <Typography variant="caption">{nf.format(val)}{maybePct}</Typography>
    </Paper>
  );
};

const SentimentDonut = ({ positive, neutral, negative }) => {
  const theme = useTheme();
  const total = (positive || 0) + (neutral || 0) + (negative || 0);

  const data = [
    { name: "Positive", value: positive || 0, color: theme.palette.success.main },
    { name: "Neutral", value: neutral || 0, color: theme.palette.action.hover },
    { name: "Negative", value: negative || 0, color: theme.palette.error.main },
  ].filter((d) => d.value > 0);

  const dataWithPct = data.map((d) => ({
    ...d,
    pct: total ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <Box sx={{ width: "100%", height: 260, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <defs>
            <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="4" floodOpacity="0.18" />
            </filter>
          </defs>
          <Pie
            data={dataWithPct}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            filter="url(#pieShadow)"
          >
            {dataWithPct.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} />
          <RTooltip content={<FancyTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <Stack
        alignItems="center"
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          justifyContent: "center",
        }}
        spacing={0.25}
      >
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Signals
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
          {nf.format(total)}
        </Typography>
      </Stack>
    </Box>
  );
};

const HBarChart = ({ rows, labelKey = "label", valueKey = "count", showPct = false }) => {
  const theme = useTheme();
  const data = (rows || []).map((r) => ({
    [labelKey]: r[labelKey],
    [valueKey]: r[valueKey],
    pct: Math.round(r.pct ?? 0),
  }));

  return (
    <Box sx={{ width: "100%", height: Math.max(180, data.length * 40) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.palette.primary.light} />
              <stop offset="100%" stopColor={theme.palette.primary.main} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={130}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Bar
            dataKey={valueKey}
            radius={[8, 8, 8, 8]}
            fill="url(#barGrad)"
            stroke={theme.palette.background.paper}
            strokeWidth={1}
          />
          <RTooltip
            cursor={{ fill: theme.palette.action.hover }}
            content={<FancyTooltip />}
            formatter={(val, _name, props) => {
              const p = props?.payload?.pct;
              return showPct ? [`${nf.format(val)} (${p}%)`, "Count"] : [nf.format(val), "Count"];
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

/* ========================== main ========================== */
export default function CallMetrics({ metrics }) {
  const m = metrics || {};

  const derived = useMemo(() => {
    const duration = m.duration_sec ?? m.duration_seconds ?? 0;
    const words = m.word_count ?? m.words_total ?? 0;
    const wpm = duration > 0 ? words / (duration / 60) : 0;

    const speakers = m.speaker_counts && typeof m.speaker_counts === "object" ? m.speaker_counts : {};
    const speakerTotal = Object.values(speakers).reduce((a, b) => a + (Number(b) || 0), 0);
    const speakerRows = Object.entries(speakers)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
      .map(([name, count]) => ({
        label: String(name),
        count: Number(count) || 0,
        pct: speakerTotal ? ((Number(count) || 0) / speakerTotal) * 100 : 0,
      }));

    const emotions = m.emotion_counts && typeof m.emotion_counts === "object" ? m.emotion_counts : {};
    const emotionTotal = Object.values(emotions).reduce((a, b) => a + (Number(b) || 0), 0);
    const emotionRows = Object.entries(emotions)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
      .map(([name, count]) => ({
        label: String(name).charAt(0).toUpperCase() + String(name).slice(1),
        count: Number(count) || 0,
        pct: emotionTotal ? ((Number(count) || 0) / emotionTotal) * 100 : 0,
      }));

    const sentiments = m.sentiment_counts && typeof m.sentiment_counts === "object" ? m.sentiment_counts : {};
    const positive = Number(sentiments.positive) || 0;
    const negative = Number(sentiments.negative) || 0;
    const neutral = Number(sentiments.neutral) || 0;
    const sentimentTotal =
      positive + negative + neutral || Object.values(sentiments).reduce((a, b) => a + (Number(b) || 0), 0);

    return {
      duration,
      words,
      wpm,
      speakerRows,
      emotionRows,
      positive,
      neutral,
      negative,
      sentimentTotal,
    };
  }, [m]);

  const uploadAt = safeDateLabel(m.upload_time);

  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      {/* Premium call header */}
      <CallHeader
        name={m.call_name}
        callId={m.call_id}
        uploadedAt={m.upload_time}
        agentId={m.agent_id}
        triggersHit={m.matched_trigger_count}
      />

      {/* Key metrics */}
      <Section title="Key Metrics">
        <Stack spacing={1.25}>
          <StatCard icon={<AccessTimeIcon fontSize="small" />} label="Duration" value={fmtDuration(derived.duration)} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <StatCard icon={<ForumIcon fontSize="small" />} label="Words" value={nf.format(derived.words)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard icon={<GraphicEqIcon fontSize="small" />} label="WPM" value={Math.round(derived.wpm)} />
            </Grid>
          </Grid>
        </Stack>
      </Section>

      {/* Sentiment (donut) */}
      <Section
        title="Sentiment"
        subtitle={
          derived.sentimentTotal
            ? `${nf.format(derived.positive)} positive • ${nf.format(derived.neutral)} neutral • ${nf.format(
                derived.negative
              )} negative`
            : undefined
        }
      >
        <SentimentDonut positive={derived.positive} neutral={derived.neutral} negative={derived.negative} />
      </Section>

      {/* Speakers */}
      <Section
        title="Speakers"
        subtitle={derived.speakerRows.length ? `${derived.speakerRows.length} speakers` : undefined}
      >
        {derived.speakerRows.length ? (
          <HBarChart rows={derived.speakerRows} showPct />
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No speaker data.
          </Typography>
        )}
      </Section>

      {/* Emotions */}
      <Section title="Emotions" subtitle="Relative frequency">
        {derived.emotionRows.length ? (
          <HBarChart rows={derived.emotionRows} showPct />
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No emotion data.
          </Typography>
        )}
      </Section>

      {/* Artifacts */}
      <Section title="Artifacts">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <StatCard icon={<InsightsIcon fontSize="small" />} label="Segments" value={m.segment_count ?? "—"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard icon={<InsightsIcon fontSize="small" />} label="Chunks" value={m.chunk_count ?? "—"} />
          </Grid>
        </Grid>
      </Section>
    </Stack>
  );
}
