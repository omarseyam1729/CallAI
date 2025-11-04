import React from "react";
import { Box, Stack, Chip, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* utils */
const fmtPct = (v) =>
  typeof v === "number" && isFinite(v)
    ? `${Math.round(v * (v <= 1 ? 100 : 1))}%`
    : null;

const titleCase = (s) =>
  s ? String(s).replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export default function CallSummary({ data }) {
  if (!data) return null;

  const sentiment = data.sentiment_label ? titleCase(data.sentiment_label) : null;
  const sentimentPct = fmtPct(data?.sentiment_confidence);
  const emotion = data.emotion_label ? titleCase(data.emotion_label) : null;
  const emotionPct = fmtPct(data?.emotion_confidence);

  const sentimentColor =
    (data?.sentiment_label === "positive" && "success") ||
    (data?.sentiment_label === "negative" && "error") ||
    "default";

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {/* Chips for sentiment & emotion */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {sentiment && (
          <Chip
            size="small"
            color={sentimentColor}
            label={`Sentiment: ${sentiment}${sentimentPct ? ` (${sentimentPct})` : ""}`}
          />
        )}
        {emotion && (
          <Chip
            size="small"
            label={`Emotion: ${emotion}${emotionPct ? ` (${emotionPct})` : ""}`}
          />
        )}
      </Stack>

      {/* LLM summary box */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          whiteSpace: "pre-wrap",
          typography: "body2",
          "& h1, & h2, & h3": { fontWeight: 600, mt: 1 },
          "& ul, & ol": { pl: 3, mb: 1 },
          "& p": { mb: 1 },
        }}
      >
        {data.llm_summary ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {data.llm_summary}
          </ReactMarkdown>
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No summary available.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
