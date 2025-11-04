import React from "react";
import {
  Card, CardContent, Stack, TextField, MenuItem, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function CallsFilters({
  q, onQ,
  agentName, onAgentName,
  dateFrom, onDateFrom,
  dateTo, onDateTo,
  rowsPerPage, onRowsPerPage
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Search by call name / description"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
              )
            }}
          />
          <TextField
            label="Agent name"
            value={agentName}
            onChange={(e) => onAgentName(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="From"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
            sx={{ minWidth: 190 }}
          />
          <TextField
            label="To"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
            sx={{ minWidth: 190 }}
          />
          <TextField
            select
            label="Per page"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPage(parseInt(e.target.value, 10))}
            sx={{ width: 140 }}
          >
            {[10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </CardContent>
    </Card>
  );
}
