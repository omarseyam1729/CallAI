// src/components/CallExplorer/AudioUploader.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Snackbar,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { api } from "../../config/api";
import CallProgress from "./CallProgress";

const ACCEPT = ".wav,.mp3,.m4a,audio/*";

export default function AudioUploader({
  onUploaded,
  fieldName = "file",
  analyzeEndpoint,
  snapshotEndpoint,
  streamEndpoint,
  autoStartProgress = true,
  pollFallbackMs = 4000,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });
  const [callId, setCallId] = useState("");

  // Metadata
  const [meta, setMeta] = useState({ name: "", description: "", agentId: "" });

  // Cleanup audio URL
  useEffect(() => () => { if (audioURL) URL.revokeObjectURL(audioURL); }, [audioURL]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);
  const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

  const attachFile = useCallback(
    (f) => {
      if (!f) return;
      if (audioURL) URL.revokeObjectURL(audioURL);
      const url = URL.createObjectURL(f);
      setFile(f);
      setAudioURL(url);
      if (inputRef.current) inputRef.current.value = "";
      setCallId("");
      setProgress(0);
    },
    [audioURL]
  );

  const onDrop = (e) => {
    prevent(e);
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) attachFile(f);
  };

  const onChange = (e) => {
    const f = e.target.files?.[0];
    if (f) attachFile(f);
  };

  const clearFile = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setFile(null);
    setAudioURL("");
    setProgress(0);
    setCallId("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append(fieldName, file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", api("/upload"), true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable)
        setProgress(Math.round((evt.loaded / evt.total) * 100));
    };

    xhr.onreadystatechange = async () => {
      if (xhr.readyState !== 4) return;
      setUploading(false);

      if (xhr.status >= 200 && xhr.status < 300) {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {}
        const id = payload?.call_id || payload?.id || "";
        setCallId(id);
        setSnack({ open: true, type: "success", msg: "Upload complete." });
        onUploaded?.(payload);

        // Patch metadata
        if (id && (meta.name || meta.description || meta.agentId)) {
          try {
            await fetch(api(`/calls/${id}`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                call_name: meta.name || null,
                call_description: meta.description || null,
                agent_id: meta.agentId ? Number(meta.agentId) : null,
              }),
            });
          } catch (err) {
            console.error("Failed to patch call metadata", err);
          }
        }

        // Run pipeline (all steps by default)
        try {
          await fetch(api(`/pipeline/${id}/run`), {
            method: "POST",
            credentials: "include",
          });
          setSnack({ open: true, type: "success", msg: "Pipeline started." });
        } catch (err) {
          setSnack({
            open: true,
            type: "error",
            msg: `Pipeline failed: ${String(err)}`,
          });
        }
      } else {
        setSnack({
          open: true,
          type: "error",
          msg: `Upload failed (${xhr.status}).`,
        });
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setSnack({
        open: true,
        type: "error",
        msg: "Network error while uploading.",
      });
    };

    xhr.send(formData);
  };

  return (
    <>
      {/* Dropzone */}
      <Paper
        elevation={4}
        sx={(t) => ({
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          border: `2px dashed ${t.palette.divider}`,
          backgroundColor:
            t.palette.mode === "light" ? "#FAFBFF" : "rgba(255,255,255,0.02)",
          transition: "all 120ms ease",
          transform: dragOver ? "scale(1.02)" : "scale(1)",
          cursor: "pointer",
          userSelect: "none",
        })}
        onClick={!file ? openPicker : undefined} // only clickable if no file chosen
        onDragEnter={(e) => {
          prevent(e);
          setDragOver(true);
        }}
        onDragOver={(e) => {
          prevent(e);
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          prevent(e);
          setDragOver(false);
        }}
        onDrop={onDrop}
      >
        <CloudUploadIcon fontSize="large" color="action" />
        <Typography variant="h6" sx={{ mt: 1 }}>
          {file ? "File attached" : "Drag & drop audio here, or click to browse"}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Supported: .wav, .mp3, .m4a
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onChange}
          style={{ display: "none" }}
        />

        {file && (
          <Stack spacing={2} sx={{ mt: 3 }} alignItems="center">
            {/* File Info */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, wordBreak: "break-word" }}
            >
              {file.name}
            </Typography>

            {audioURL && (
              <Box sx={{ width: "100%", maxWidth: 560 }}>
                <audio src={audioURL} controls style={{ width: "100%" }} />
              </Box>
            )}

            {/* Metadata form */}
            <Box
              sx={{
                width: "100%",
                maxWidth: 480,
                p: 2,
                borderRadius: 2,
                backgroundColor: (t) =>
                  t.palette.mode === "light"
                    ? "rgba(0,0,0,0.03)"
                    : "rgba(255,255,255,0.05)",
              }}
              onClick={(e) => e.stopPropagation()} // don't trigger picker
            >
              <Stack spacing={1.5}>
                <TextField
                  label="Call Name"
                  size="small"
                  value={meta.name}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, name: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Description"
                  size="small"
                  value={meta.description}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, description: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Agent ID"
                  size="small"
                  value={meta.agentId}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, agentId: e.target.value }))
                  }
                  fullWidth
                />
              </Stack>
            </Box>

            {/* Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<RocketLaunchIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  upload();
                }}
                disabled={uploading}
              >
                Upload & Analyze
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={uploading}
              >
                Clear
              </Button>
            </Stack>

            {/* Progress */}
            {uploading && (
              <Box sx={{ width: "100%", maxWidth: 560 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Uploading… {progress}%
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>

      {/* Call Progress */}
      {callId && !uploading && (
        <Paper elevation={2} sx={{ mt: 3, p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Processing Call…
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <CallProgress
            callId={callId}
            analyzeEndpoint={analyzeEndpoint}
            snapshotEndpoint={(id) =>
              snapshotEndpoint
                ? typeof snapshotEndpoint === "function"
                  ? snapshotEndpoint(id)
                  : snapshotEndpoint
                : api(`/call/progress/${id}`)
            }
            streamEndpoint={(id) =>
              streamEndpoint
                ? typeof streamEndpoint === "function"
                  ? streamEndpoint(id)
                  : streamEndpoint
                : api(`/call/progress/${id}/stream`)
            }
            autoStart={autoStartProgress}
            pollFallbackMs={pollFallbackMs}
          />
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
