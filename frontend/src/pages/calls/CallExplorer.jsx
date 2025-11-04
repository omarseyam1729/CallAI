// src/pages/CallExplorer.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";

import AudioUploader from "../../components/CallExplorer/AudioUploader";
import KeywordSearch from "../../components/CallExplorer/KeywordSearch";
import SemanticSearch from "../../components/CallExplorer/SemanticSearch";
import ResultsList from "../../components/CallExplorer/ResultsList";
import CallsList from "./CallList";

function useQueryAction(defaultAction = "upload") {
  const [params, setParams] = useSearchParams();
  const action = params.get("action") || defaultAction;

  const setAction = useCallback(
    (a) => {
      const next = new URLSearchParams(params);
      if (!a || a === defaultAction) next.delete("action");
      else next.set("action", a);
      setParams(next, { replace: true });
    },
    [params, setParams, defaultAction]
  );

  return [action, setAction];
}

export default function CallExplorer() {
  // Default to "list" so Explore shows first if someone lands on /explorer
  const [action, setAction] = useQueryAction("list");
  const navigate = useNavigate();

  const [results, setResults] = useState([]);

  // Clear search/upload results when switching tool (but not for list mode)
  useEffect(() => {
    if (action !== "list") setResults([]);
  }, [action]);

  const onUploaded = useCallback((resp) => {
    const id = resp?.call_id ?? resp?.id ?? "uploaded";
    const title =
      resp?.filename ?? resp?.original_filename ?? resp?.display_name ?? "Uploaded audio";
    setResults([{ id, title, subtitle: "Uploaded", _meta: { call_id: id } }]);
  }, []);

  // Click a result → go to call details
  const openResult = useCallback(
    (r) => {
      const callId = r._meta?.call_id || r.call_id || r.id;
      navigate(`/calls/${callId}`, {
        state: {
          highlightSegment: r._meta?.segment_id ?? null,
          start: r._meta?.start ?? null,
        },
      });
    },
    [navigate]
  );

  // Panels
  const UploadPanel = useMemo(() => <AudioUploader onUploaded={onUploaded} />, [onUploaded]);
  const SearchPanel = useMemo(() => <KeywordSearch onResults={setResults} />, []);
  const SemanticPanel = useMemo(() => <SemanticSearch onResults={setResults} />, []);

  const ActivePanel = useMemo(() => {
    if (action === "list") return <CallsList />;
    if (action === "search") return SearchPanel;
    if (action === "semantic") return SemanticPanel;
    return UploadPanel; // "upload"
  }, [action, SearchPanel, SemanticPanel, UploadPanel]);

  // Friendly title that matches the active tool
  const title = useMemo(() => {
    if (action === "list") return "Call Explorer";
    if (action === "search") return "Call Explorer — Keyword Search";
    if (action === "semantic") return "Call Explorer — Semantic Search";
    return "Call Explorer — Upload";
  }, [action]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          {title}
        </Typography>

        {/* Quick mode switcher mirrors the Topbar actions */}
      </Stack>

      {/* Active tool panel */}
      <Box sx={{ mt: 1, mb: 2 }}>{ActivePanel}</Box>

      {/* Results list only for upload/search/semantic */}
      {action !== "list" && (
        <ResultsList
          results={results}
          onOpen={openResult}
          emptyText={
            action === "upload"
              ? "Upload an audio file to see it here."
              : "No results yet. Try a query."
          }
        />
      )}
    </Box>
  );
}
