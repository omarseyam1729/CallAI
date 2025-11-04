// utils/snippet.js (optional file; or paste directly into the component file)
export function extractCallId(row) {
  const id = row?.call_id ?? row?.callId ?? row?.id ?? row?.uuid ?? row?.pk ?? row?.uid ?? null;
  return id == null ? null : String(id);
}

export function extractSnippet(row) {
  const raw =
    row?.snippet ??
    row?.preview ??
    row?.transcript ??
    row?.transcription ??
    row?.text ??
    row?.content ??
    "";

  const normalized = String(raw).replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  // Try first 2 sentences
  const sentences = normalized.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const s = sentences || normalized;

  // Hard cap to avoid tall rows
  const MAX = 220;
  return s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s;
}
