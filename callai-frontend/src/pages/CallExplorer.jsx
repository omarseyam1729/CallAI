import React, { useState, useEffect } from "react";
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

  // Fetch call data from API
  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
        order,
        ...(q && { q }),
      });
      const res = await fetch(api(`/calls?${params.toString()}`), {
        headers: { accept: "application/json" },
      });
      const data = await res.json();
      setCalls(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching calls:", err);
    }
    setLoading(false);
  };

  // Fetch on mount and when pagination/sorting changes
  useEffect(() => {
    fetchCalls();
  }, [page, perPage, order]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 w-full">
      <Card className="border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Call Explorer
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Top search + order controls */}
          <CallFilters
            q={q}
            setQ={setQ}
            order={order}
            setOrder={setOrder}
            fetchCalls={fetchCalls}
            loading={loading}
          />

          {/* Data table */}
          {loading ? (
            <Skeleton className="h-40 w-full rounded-lg mt-4" />
          ) : (
            <CallTable calls={calls} />
          )}

          {/* Pagination controls */}
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
