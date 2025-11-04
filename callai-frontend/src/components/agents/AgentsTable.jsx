import React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table"
import { Edit, Trash } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

export default function AgentsTable({ rows, loading, busyId, onEdit, onDelete }) {
  const Actions = ({ row }) => {
    const isBusy = busyId === row.id
    return (
      <div className="flex justify-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(row)}
                disabled={isBusy}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Agent</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(row.id)}
                disabled={isBusy}
              >
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Agent</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="max-w-sm">Description</TableHead>
            <TableHead className="w-20 text-center">Age</TableHead>
            <TableHead className="w-28 text-center">Sex</TableHead>
            <TableHead className="text-right w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-6 text-muted-foreground">
                No agents found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={row.id}
                className={`${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                } transition-colors hover:bg-muted/40`}
              >
                <TableCell>{row.id}</TableCell>
                <TableCell className="font-medium">{row.name || "—"}</TableCell>
                <TableCell className="truncate max-w-xs text-muted-foreground">
                  {row.description || "—"}
                </TableCell>
                <TableCell className="text-center">{row.age ?? "—"}</TableCell>
                <TableCell className="capitalize text-center">
                  {row.sex || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Actions row={row} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
