// src/api/progress.js
import { api } from "../config/api";

/**
 * Snapshot: one-time fetch of progress for a call.
 * Backend: GET /progress/{call_id}
 *
 * Response shape (ProgressResponse):
 * {
 *   call_id: string,
 *   total_chunks: number,
 *   done_chunks: number,
 *   pending_chunks: number,
 *   error_chunks: number,
 *   progress_percent: number
 * }
 */
export async function getCallProgress(callId) {
  if (!callId) throw new Error("callId is required");
  const res = await fetch(api(`/call/progress/${encodeURIComponent(callId)}`), {
    // add `credentials: "include"` if your auth needs cookies
    // credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `getCallProgress failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Streaming (SSE): live progress updates.
 * Backend: GET /progress/{call_id}/stream
 *
 * Usage:
 *   const { source, close } = streamCallProgress(id, {
 *     onData: (p) => console.log(p),
 *     onError: (e) => console.error(e),
 *     onEnd: () => console.log("done"),
 *   });
 *   // later: close();
 *
 * Note: SSE uses cookies automatically on same-origin. If you need custom headers,
 * use an EventSource polyfill that supports headers.
 */
export function streamCallProgress(callId, {
  onData,
  onOpen,
  onError,
  onEnd,
  withCredentials = true,
  autoCloseOnComplete = true,
} = {}) {
  if (!callId) throw new Error("callId is required");

  // Native EventSource supports withCredentials in most modern browsers.
  const url = api(`/call/progress/${encodeURIComponent(callId)}/stream`);
  const source = new EventSource(url, { withCredentials });

  source.onopen = () => {
    onOpen?.();
  };

  source.onerror = (e) => {
    // Server may send `event: error` or just close; both will hit onerror
    onError?.(e);
    // Some servers keep the connection; others close—don't auto-close here.
  };

  source.onmessage = (evt) => {
    try {
      const payload = JSON.parse(evt.data);
      onData?.(payload);

      if (autoCloseOnComplete && payload?.pending_chunks === 0) {
        // Completed — close stream and notify.
        source.close();
        onEnd?.(payload);
      }
    } catch (err) {
      onError?.(err);
    }
  };

  const close = () => {
    try { source.close(); } catch {}
    onEnd?.();
  };

  return { source, close };
}
