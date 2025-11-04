import React, { useState } from "react";
import {
  Paper,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  TablePagination,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import FlashOnIcon from "@mui/icons-material/FlashOn";   // run pipeline
import RestartAltIcon from "@mui/icons-material/RestartAlt"; // reset
import { fmtDuration } from "./utils";
import CallProgress from "./CallProgress";

// API functions
import { runPipeline, resetCall } from "../../api/calls";

export default function CallsTable({
  rows,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  onEdit,
  onOpenDetails,
  onOpenMetrics,
  showProgress = true,
  progressRefreshKey = 0,
}) {
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const handleSnack = (message, severity = "info") => {
    setSnack({ open: true, message, severity });
  };

  const handleRunPipeline = async (callId) => {
    try {
      handleSnack(`Running pipeline for ${callId}...`, "info");
      const data = await runPipeline(callId);
      handleSnack(`Pipeline completed for ${callId}`, "success");
      console.log("Pipeline result:", data);
    } catch (err) {
      console.error(err);
      handleSnack(`Pipeline failed for ${callId}`, "error");
    }
  };

  const handleResetCall = async (callId) => {
    try {
      handleSnack(`Resetting call ${callId}...`, "info");
      const data = await resetCall(callId);
      handleSnack(`Call ${callId} reset successfully`, "success");
      console.log("Reset result:", data);
    } catch (err) {
      console.error(err);
      handleSnack(`Reset failed for ${callId}`, "error");
    }
  };

  return (
    <Paper variant="outlined">
      {loading && <LinearProgress />}
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={380}>Call</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Duration</TableCell>
              {showProgress && <TableCell width={260}>Progress</TableCell>}
              <TableCell width={240} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showProgress ? 6 : 5}>
                  <Box sx={{ py: 6, textAlign: "center", opacity: 0.7 }}>
                    <TuneIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body1">No calls match your filters.</Typography>
                    <Typography variant="body2">
                      Try clearing filters or adjusting the date range.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {rows.map((r) => {
              const title = r.call_name || "(untitled)";
              const desc = r.call_description || "";
              return (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => onRowClick(r.id)}
                >
                  <TableCell>
                    <Typography fontWeight={700} noWrap>{title}</Typography>
                    {desc && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {desc}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                      {r.id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {r.agent_name
                      ? <Chip label={r.agent_name} size="small" />
                      : <Chip label="No agent" size="small" variant="outlined" />}
                  </TableCell>

                  <TableCell>{new Date(r.upload_time).toLocaleString()}</TableCell>
                  <TableCell align="right">{fmtDuration(r.duration_sec)}</TableCell>

                  {showProgress && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <CallProgress
                        callId={r.id}
                        mode="snapshot"
                        compact
                        showDetails={false}
                        refreshKey={progressRefreshKey}
                      />
                    </TableCell>
                  )}

                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Run pipeline">
                      <IconButton size="small" color="primary" onClick={() => handleRunPipeline(r.id)}>
                        <FlashOnIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset call">
                      <IconButton size="small" color="error" onClick={() => handleResetCall(r.id)}>
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit(r.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => onOpenDetails(r.id)}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View metrics">
                      <IconButton size="small" onClick={() => onOpenMetrics(r.id)}>
                        <QueryStatsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider />
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
