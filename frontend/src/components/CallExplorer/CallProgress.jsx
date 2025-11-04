import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";

import { getCallProgress, streamCallProgress } from "../../api/progress";

export default function CallProgress({
  callId,
  mode = "poll",           // "poll" | "sse" | "snapshot"
  intervalMs = 1500,
  compact = false,
  showDetails = true,
  enabled = true,
  refreshKey = 0,
  onUpdate,
  onDone,
  sx,
}) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(Boolean(enabled));
  const timerRef = useRef(null);
  const sseRef = useRef(null);

  // --- helpers ---
  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const closeSSE = () => {
    try { sseRef.current?.close?.(); } catch {}
    sseRef.current = null;
  };

  const pct = useMemo(() => {
    if (typeof data?.progress_percent === "number" && isFinite(data.progress_percent)) {
      return Math.round(Math.max(0, Math.min(100, data.progress_percent)));
    }
    if (
      typeof data?.done_chunks === "number" &&
      typeof data?.total_chunks === "number" &&
      data.total_chunks > 0
    ) {
      return Math.round((data.done_chunks / data.total_chunks) * 100);
    }
    return null;
  }, [data]);

  const isComplete = data?.pending_chunks === 0 && (data?.total_chunks ?? 1) >= 0;
  const hasErrors = (data?.error_chunks || 0) > 0;

  const status = useMemo(() => {
    if (isComplete) return "completed";
    if (!data && loading) return "processing";
    if (hasErrors && !isComplete) return "processing_with_errors";
    if (!enabled) return "paused";
    return "processing";
  }, [data, loading, isComplete, hasErrors, enabled]);

  const stageLabel = useMemo(() => {
    if (status === "completed") return "Completed";
    if (status === "processing_with_errors") return "Errors";
    if (status === "paused") return "Paused";
    if (data?.pending_chunks != null) return "Processing";
    return loading ? "Loading…" : "—";
  }, [status, data, loading]);

  const icon = useMemo(() => {
    if (status === "completed") return <CheckCircleIcon fontSize="small" />;
    if (status === "processing_with_errors") return <ErrorIcon fontSize="small" />;
    if (status === "paused") return <HourglassBottomIcon fontSize="small" />;
    return <AccessTimeIcon fontSize="small" />;
  }, [status]);

  const chipColor =
    status === "completed"
      ? "success"
      : status === "processing_with_errors"
      ? "error"
      : status === "paused"
      ? "default"
      : "info";

  // --- effect: fetch progress ---
  useEffect(() => {
    if (!enabled || !callId) {
      setLoading(false);
      return () => {};
    }

    setErr("");
    setLoading(true);
    setData(null);

    if (mode === "snapshot") {
      (async () => {
        try {
          const payload = await getCallProgress(callId);
          setData(payload);
          onUpdate?.(payload);
          if (payload?.pending_chunks === 0) onDone?.(payload);
        } catch (e) {
          setErr(e?.message || "Failed to fetch progress");
        } finally {
          setLoading(false);
        }
      })();
      return () => {};
    }

    if (mode === "sse") {
      const { close } = streamCallProgress(callId, {
        withCredentials: true,
        autoCloseOnComplete: true,
        onData: (payload) => {
          setData(payload);
          onUpdate?.(payload);
          if (payload?.pending_chunks === 0) {
            setLoading(false);
            onDone?.(payload);
          }
        },
        onError: () => setErr("Stream error"),
        onEnd: () => setLoading(false),
      });
      sseRef.current = { close };
      return () => closeSSE();
    }

    const tick = async () => {
      try {
        const payload = await getCallProgress(callId);
        setData(payload);
        onUpdate?.(payload);
        if (payload?.pending_chunks === 0) {
          setLoading(false);
          onDone?.(payload);
          return;
        }
      } catch (e) {
        setErr(e?.message || "Failed to fetch progress");
      }
      timerRef.current = setTimeout(tick, intervalMs);
    };

    tick();
    return () => clearTimers();
  }, [callId, mode, intervalMs, enabled, onUpdate, onDone, refreshKey]);

  const determinate = typeof pct === "number";

  return (
    <Box sx={{ p: compact ? 0 : 1, ...sx }}>
      <Stack spacing={compact ? 0.5 : 1}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {!compact && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                color={chipColor}
                icon={icon}
                label={stageLabel}
                variant="filled"
                sx={{ fontWeight: 500, borderRadius: "1rem" }}
              />
            </Stack>
          )}
          <Typography
            variant={compact ? "caption" : "body2"}
            color="text.secondary"
            sx={{ ml: compact ? 0 : "auto" }}
          >
            {determinate ? `${pct}%` : loading ? "…" : "—"}
          </Typography>
        </Stack>

        {/* Sleek Progress bar */}
        <LinearProgress
          variant={determinate ? "determinate" : "indeterminate"}
          value={determinate ? pct : undefined}
          sx={{
            height: compact ? 4 : 6,
            borderRadius: 4,
            backgroundColor: (t) => t.palette.grey[200],
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              backgroundImage: "linear-gradient(90deg, #4F6BED, #5AC18E)",
            },
          }}
        />

        {/* Details */}
        {showDetails && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {data
                ? `${data.done_chunks ?? "—"}/${data.total_chunks ?? "—"} done • ${
                    data.pending_chunks ?? "—"
                  } pending`
                : "—"}
            </Typography>
            {err && (
              <Tooltip title={err}>
                <ErrorIcon color="error" fontSize="small" />
              </Tooltip>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
