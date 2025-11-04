import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export default function CallFilters({
  q,
  setQ,
  order,
  setOrder,
  fetchCalls,
  loading,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search calls..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-56"
        />
        <Button onClick={fetchCalls} variant="secondary" disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <Select value={order} onValueChange={setOrder}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest</SelectItem>
          <SelectItem value="asc">Oldest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
