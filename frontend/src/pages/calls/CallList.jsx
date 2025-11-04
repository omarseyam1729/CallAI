import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Stack, Typography, IconButton, Tooltip, Card, CardContent
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../config/api";

// components
import CallsFilters from "../../components/CallExplorer/CallsFilters";
import CallsTable from "../../components/CallExplorer/CallsTable";
import EditCallDialog from "../../components/CallExplorer/EditCallDialog";

// utils
import { startOfDayISO, nextDayISO, toInt } from "../../components/CallExplorer/utils";

export default function CallsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- state backed by URL ---
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [agentName, setAgentName] = useState(searchParams.get("agent_name") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from")?.slice(0, 10) || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to")?.slice(0, 10) || "");
  const [order, setOrder] = useState(searchParams.get("order") === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(toInt(searchParams.get("page"), 1) - 1); // MUI uses 0-based
  const [rowsPerPage, setRowsPerPage] = useState(toInt(searchParams.get("per_page"), 25));

  // --- data ---
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [error, setError] = useState(null);

  // --- edit dialog state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ call_name: "", call_description: "", agent_id: "" });
  const [editError, setEditError] = useState("");

  // Sync URL with state
  const syncUrl = useCallback(
    (overrides = {}) => {
      const p = new URLSearchParams(searchParams);
      const kv = {
        q,
        agent_name: agentName,
        date_from: dateFrom ? startOfDayISO(dateFrom) : "",
        date_to: dateTo ? nextDayISO(dateTo) : "",
        order,
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
        action: "list",
        ...overrides,
      };
      Object.entries(kv).forEach(([k, v]) => {
        if (!v) p.delete(k);
        else p.set(k, v);
      });
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams, q, agentName, dateFrom, dateTo, order, page, rowsPerPage]
  );

  // Fetch calls
  const fetchCalls = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("page", (page + 1).toString());
        qs.set("per_page", rowsPerPage.toString());
        qs.set("order", order);
        if (q.trim()) qs.set("q", q.trim());
        if (agentName.trim()) qs.set("agent_name", agentName.trim());
        if (dateFrom) qs.set("date_from", startOfDayISO(dateFrom));
        if (dateTo) qs.set("date_to", nextDayISO(dateTo));

        const res = await fetch(api(`/calls?${qs.toString()}`), {
          signal,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResp(data);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, order, q, agentName, dateFrom, dateTo]
  );

  // Debounced load whenever inputs change
  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => {
      syncUrl();
      fetchCalls(ac.signal);
    }, 300);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [q, agentName, dateFrom, dateTo, order, page, rowsPerPage, syncUrl, fetchCalls]);

  // Handlers
  const handleChangeRowsPerPage = (n) => {
    setRowsPerPage(n);
    setPage(0);
  };
  const handleReset = () => {
    setQ("");
    setAgentName("");
    setDateFrom("");
    setDateTo("");
    setOrder("desc");
    setPage(0);
    setRowsPerPage(25);
  };

  // --- Edit dialog ops ---
  const openEdit = async (id) => {
    setEditId(id);
    setEditOpen(true);
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(api(`/calls/${encodeURIComponent(id)}`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // { id, upload_time, call_name, call_description, agent_id }
      setForm({
        call_name: data.call_name ?? "",
        call_description: data.call_description ?? "",
        agent_id: data.agent_id ?? "",
      });
    } catch (e) {
      setEditError(e.message || "Failed to load call");
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    setEditError("");
    try {
      const payload = {
        call_name: form.call_name === "" ? null : form.call_name,
        call_description: form.call_description === "" ? null : form.call_description,
        agent_id:
          form.agent_id === "" || form.agent_id === null
            ? null
            : Number.isNaN(Number(form.agent_id))
              ? null
              : Number(form.agent_id),
      };
      const res = await fetch(api(`/calls/${encodeURIComponent(editId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      await fetchCalls(); // refresh list to reflect changes
      setEditOpen(false);
    } catch (e) {
      setEditError(e.message || "Failed to save");
    } finally {
      setEditSaving(false);
    }
  };

  const rows = resp?.items || [];
  const total = resp?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header / Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Calls</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Reset filters">
            <IconButton onClick={handleReset} aria-label="Reset filters">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Sort by upload time (${order})`}>
            <IconButton
              aria-label="Toggle sort order"
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            >
              <SwapVertIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters */}
      <CallsFilters
        q={q} onQ={(v) => { setQ(v); setPage(0); }}
        agentName={agentName} onAgentName={(v) => { setAgentName(v); setPage(0); }}
        dateFrom={dateFrom} onDateFrom={(v) => { setDateFrom(v); setPage(0); }}
        dateTo={dateTo} onDateTo={(v) => { setDateTo(v); setPage(0); }}
        rowsPerPage={rowsPerPage}
        onRowsPerPage={(n) => { handleChangeRowsPerPage(n); }}
      />

      {/* Table */}
      <CallsTable
        rows={rows}
        total={total}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { handleChangeRowsPerPage(parseInt(e.target.value, 10)); }}
        onRowClick={(id) => navigate(`/calls/${encodeURIComponent(id)}`)}
        onEdit={openEdit}
        onOpenDetails={(id) => navigate(`/calls/${encodeURIComponent(id)}`)}
        onOpenMetrics={(id) => navigate(`/explorer?action=metrics&callId=${encodeURIComponent(id)}`)}
      />

      {error && (
        <Card sx={{ mt: 2 }} variant="outlined">
          <CardContent>
            <Typography color="error" fontWeight={600}>Error: {error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <EditCallDialog
        open={editOpen}
        loading={editLoading}
        saving={editSaving}
        error={editError}
        form={form}
        setForm={setForm}
        onClose={() => setEditOpen(false)}
        onSave={saveEdit}
      />
    </Box>
  );
}
