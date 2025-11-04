// src/api/calls.js
import { api } from "../config/api";

// --- Search ---
export async function searchCalls(query) {
  const res = await fetch(api("/search/semantic"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Search calls failed: ${res.status}`);
  return res.json();
}

// --- Pipeline ---
export async function runPipeline(callId) {
  const res = await fetch(api(`/pipeline/${callId}/run`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // run all steps by default
  });
  if (!res.ok) throw new Error(`Run pipeline failed: ${res.status}`);
  return res.json();
}

// --- Reset ---
export async function resetCall(callId) {
  const res = await fetch(api(`/pipeline/${callId}/reset`), {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Reset call failed: ${res.status}`);
  return res.json();
}
