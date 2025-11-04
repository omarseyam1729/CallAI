import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import CallFilters from "@/components/calls/CallFilters";
import CallTable from "@/components/calls/CallTable";
import PaginationFooter from "@/components/calls/PaginationFooter";

export default function CallExplorer() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [order, setOrder] = useState("desc");
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);

  // advanced filters
  const [filters, setFilters] = useState({
    agent_name: null,
    date_from: null,
    date_to: null,
  });

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
        order,
        ...(q && { q }),
        ...(filters.agent_name && { agent_name: filters.agent_name }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });

      const res = await fetch(api(`/calls?${params.toString()}`), {
        headers: { accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setCalls(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(" Error fetching calls:", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, order, q, filters]);

  // initial + reactive fetch
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="w-full p-6 space-y-4">
      <Card className="border rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Call Explorer
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <CallFilters
            q={q}
            setQ={setQ}
            order={order}
            setOrder={setOrder}
            fetchCalls={fetchCalls}
            loading={loading}
            setExtraFilters={setFilters}
          />

          {/* Table */}
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <CallTable calls={calls} />
          )}

          {/* Pagination */}
          <PaginationFooter
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
