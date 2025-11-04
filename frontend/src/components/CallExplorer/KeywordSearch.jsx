import React, { useState, useCallback } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { api } from "../../config/api";
import SearchBar from "./SearchBar";

const normalize = (rows) =>
  (Array.isArray(rows) ? rows : []).map((r, i) => ({
    id: r.segment_id ?? r.call_id ?? i,
    title: r.call_id ? `Call ${r.call_id}` : `Result ${i + 1}`,
    subtitle: r.text ?? "",
    // you can keep extra fields if your ResultsList item click needs them:
    _meta: {
      score: r.score,
      start: r.start,
      end: r.end,
      duration: r.duration,
      speaker: r.speaker,
      call_id: r.call_id,
      segment_id: r.segment_id,
    },
  }));

export default function KeywordSearch({ onResults, callId = "", topK = 20 }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const resp = await fetch(api(`/search/keyword`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          call_id: callId || null,
          top_k: topK,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      onResults?.(normalize(data));
    } catch (e) {
      onResults?.([]);
      // optional: surface error to a snackbar
      // console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, callId, topK, onResults]);

  const onEnter = (e) => { if (e.key === "Enter") fetchSearch(); };

  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      onSearch={fetchSearch}
      onClear={() => { setQuery(""); onResults?.([]); }}
      placeholder="Keyword search (across all calls)"
      icon={<SearchIcon />}
      onEnter={onEnter}
      loading={loading}
    />
  );
}
