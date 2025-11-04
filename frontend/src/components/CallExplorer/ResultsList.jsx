import React from "react";
import {
  List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Divider, Typography
} from "@mui/material";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";

export default function ResultsList({ results = [], onOpen, emptyText = "No results." }) {
  if (!results.length) {
    return <Typography variant="body2" sx={{ opacity: 0.7 }}>{emptyText}</Typography>;
  }

  return (
    <List sx={{ width: "100%", maxWidth: 760 }}>
      {results.map((r, idx) => (
        <React.Fragment key={r.id ?? idx}>
          <ListItemButton onClick={() => onOpen?.(r)}>
            <ListItemAvatar><Avatar><HeadsetMicIcon /></Avatar></ListItemAvatar>
            <ListItemText
              primary={r.title || `Result ${idx + 1}`}
              secondary={r.subtitle || ""}
            />
          </ListItemButton>
          {idx < results.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
}
