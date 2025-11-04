import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationFooter({
  page,
  setPage,
  totalPages,
  perPage,
  setPerPage,
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Select
        value={String(perPage)}
        onValueChange={(v) => setPerPage(Number(v))}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Rows" />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50, 100].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
