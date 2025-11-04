// src/api/batches.js
import { api } from "../config/api";

async function handle(res, msg) {
  if (!res.ok) throw new Error(`${msg}: ${res.status}`);
  // always return JSON if available
  try {
    return await res.json();
  } catch {
    return null; // for 204 No Content responses
  }
}

// ----------- CRUD -----------
export const createBatch = (body) =>
  fetch(api("/batch/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle(r, "Create batch"));

export const deleteBatch = (id) =>
  fetch(api(`/batch/${id}`), { method: "DELETE" }).then((r) =>
    handle(r, "Delete batch")
  );

export const getBatch = (id) =>
  fetch(api(`/batch/${id}`)).then((r) => handle(r, "Get batch"));

// ----------- Execution -----------
export const getBatchProgress = (id) =>
  fetch(api(`/batch/${id}/progress`)).then((r) => handle(r, "Progress"));

export const getBatchReport = (id) =>
  fetch(api(`/batch/${id}/report`)).then((r) => handle(r, "Report"));

export const startBatch = (id) =>
  fetch(api(`/batch/${id}/start`), { method: "POST" }).then((r) =>
    handle(r, "Start batch")
  );

// ----------- Calls -----------
export const attachCalls = (id, ids) =>
  fetch(api(`/batch/${id}/calls`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_ids: ids }),
  }).then((r) => handle(r, "Attach calls"));

export const detachCalls = (id, ids) =>
  fetch(api(`/batch/${id}/calls`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_ids: ids }),
  }).then((r) => handle(r, "Detach calls"));

// ----------- Triggers -----------
export const attachTriggers = (id, ids) =>
  fetch(api(`/batch/${id}/triggers`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger_ids: ids }),
  }).then((r) => handle(r, "Attach triggers"));

export const detachTriggers = (id, ids) =>
  fetch(api(`/batch/${id}/triggers`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger_ids: ids }),
  }).then((r) => handle(r, "Detach triggers"));
