import React from "react";
import { Paper, IconButton, TextField, Button } from "@mui/material";

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder,
  icon,
  onEnter,
}) {
  return (
    <Paper elevation={3} sx={{ p: 1, borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton color="primary" onClick={onSearch} aria-label="search">
        {icon}
      </IconButton>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => onEnter?.(e)}
      />
      {value && (
        <Button onClick={onClear} color="inherit">Clear</Button>
      )}
      <Button variant="contained" onClick={onSearch}>Search</Button>
    </Paper>
  );
}
