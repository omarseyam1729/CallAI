import { useState, useCallback } from "react";
import { api } from "../../config/api";

function useTriggersApi() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  const fetchTriggers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api("/triggers"));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `Failed to fetch (HTTP ${res.status})`);
      setList(data);
      setErr("");
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrigger = async (payload) => {
    const res = await fetch(api("/triggers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Create failed (HTTP ${res.status})`);
    return data;
  };

  const updateTrigger = async (id, payload) => {
    const res = await fetch(api(`/triggers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Update failed (HTTP ${res.status})`);
    return data;
  };

  const deleteTrigger = async (id) => {
    const res = await fetch(api(`/triggers/${id}`), { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.detail || `Delete failed (HTTP ${res.status})`);
    }
    return true;
  };

  const evalSingle = async (triggerId, callId) => {
    const res = await fetch(api(`/triggers/${Number(triggerId)}/evaluate`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || `Eval failed (HTTP ${res.status})`);
    return data;
  };

  const evalMultiple = async (triggerIds, callId) => {
    const ids = triggerIds.map(Number).filter(Number.isFinite);
    const res = await fetch(api("/triggers/evaluate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id: callId, trigger_ids: ids }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || `Eval failed (HTTP ${res.status})`);
    return data;
  };

  return {
    list, loading, error, fetchTriggers,
    createTrigger, updateTrigger, deleteTrigger,
    evalSingle, evalMultiple,
  };
}

export default useTriggersApi; // 👈 default export
