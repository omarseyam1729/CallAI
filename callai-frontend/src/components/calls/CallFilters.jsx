import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Filter, RefreshCw, X } from "lucide-react";

export default function CallFilters({
  q,
  setQ,
  order,
  setOrder,
  fetchCalls,
  loading,
  setExtraFilters,
}) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const applyFilters = () => {
    setExtraFilters({
      agent_name: agent || null,
      date_from: dateFrom || null,
      date_to: dateTo || null,
    });
    fetchCalls();
    setOpen(false);
  };

  const clearFilters = () => {
    setAgent("");
    setDateFrom("");
    setDateTo("");
    setQ("");
    setOrder("desc");
    setExtraFilters({ agent_name: null, date_from: null, date_to: null });
    fetchCalls();
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left: Search bar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by call name or description..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-72"
        />
        <Button
          onClick={fetchCalls}
          variant="secondary"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Right: Filters modal trigger */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Filter Calls</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-3">
            {/* Agent Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Agent Name</label>
              <Input
                placeholder="Enter agent name..."
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Order */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Sort Order</label>
              <Select value={order} onValueChange={setOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-2 pt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>

            <Button
              onClick={applyFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
