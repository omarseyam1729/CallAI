import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CallTable({ calls }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Call Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Uploaded</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.length ? (
          calls.map((c) => (
            <TableRow key={c.call_name}>
              <TableCell className="font-medium">{c.call_name}</TableCell>
              <TableCell className="max-w-[350px] truncate text-muted-foreground">
                {c.call_description || "—"}
              </TableCell>
              <TableCell>{c.agent_name || "—"}</TableCell>
              <TableCell>
                {new Date(c.upload_time).toLocaleString()}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground py-6"
            >
              No calls found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
