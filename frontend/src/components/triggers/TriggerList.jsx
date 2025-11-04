import React, { useState } from "react";
import {
  Stack, Card, CardContent, Checkbox, Box, Typography, Chip, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Divider, Link
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Link as RouterLink } from "react-router-dom";

const TriggerTypeChip = ({ type }) => (
  <Chip
    size="small"
    label={type === "regex" ? "Regex" : "Semantic"}
    color={type === "regex" ? "primary" : "secondary"}
    variant="outlined"
  />
);

export default function TriggerList({
  items, selected, onToggleSelect, onEdit, onDelete, onEvaluate,
}) {
  const [deleteId, setDeleteId] = useState(null);

  const confirmDelete = (id) => setDeleteId(id);
  const handleDelete = async () => {
    await onDelete(deleteId);
    setDeleteId(null);
  };

  return (
    <>
      <Stack spacing={2}>
        {items.map((t) => (
          <Card key={t.id} variant="outlined" sx={{ overflow: "hidden" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                {/* Left: selection + clickable trigger info */}
                <Stack direction="row" alignItems="center" gap={2} flex={1}>
                  {/* Stop link navigation when toggling the checkbox */}
                  <Checkbox
                    checked={selected.includes(t.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(t.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    inputProps={{ "aria-label": `Select ${t.name}` }}
                  />

                  {/* Clickable info block */}
                  <Box
                    component={RouterLink}
                    to={`/triggers/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      textDecoration: "none",
                      color: "inherit",
                      flex: 1,
                      borderRadius: 1,
                      px: 0.5,
                      "&:focus-visible": {
                        outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: "2px",
                      },
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t.name}
                      </Typography>
                      <TriggerTypeChip type={t.type} />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {t.description || "—"}
                    </Typography>

                    <Stack direction="row" spacing={1} mt={0.5}>
                      {t.type === "regex" ? (
                        <>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`pattern: ${t?.config?.pattern ?? ""}`}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`case_sensitive: ${!!t?.config?.case_sensitive}`}
                          />
                        </>
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`criteria_text: ${(t?.config?.criteria_text ?? "").slice(0, 60)}${
                            (t?.config?.criteria_text ?? "").length > 60 ? "…" : ""
                          }`}
                        />
                      )}
                    </Stack>

                    {/* Optional inline hint to show it’s clickable */}
                    <Typography variant="caption" color="text.secondary">
                      View evaluation history →
                    </Typography>
                  </Box>
                </Stack>

                {/* Right: row actions (don’t navigate) */}
                <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Evaluate on a call">
                    <IconButton color="primary" onClick={() => onEvaluate(t.id)}>
                      <PlayCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit trigger">
                    <IconButton onClick={() => onEdit(t)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete trigger">
                    <IconButton color="error" onClick={() => confirmDelete(t.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Trigger</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this trigger?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
