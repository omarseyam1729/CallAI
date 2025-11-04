// src/pages/BatchMode.jsx
import React from "react";
import {
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import AssessmentIcon from "@mui/icons-material/Assessment";

export default function BatchMode() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Batch Mode
      </Typography>

      <Stack spacing={3}>
        {/* Configure Triggers */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TuneIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Configure Triggers</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" gutterBottom>
            Define regex or semantic triggers that will be applied across uploaded calls.
          </Typography>
          <Button variant="contained">Open Trigger Config</Button>
        </Paper>

        {/* Run Batch */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <PlayCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="h6">Run Batch</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" gutterBottom>
            Upload multiple calls and run the analysis pipeline using the selected triggers.
          </Typography>
          <Button variant="contained" color="success">
            Upload & Run
          </Button>
        </Paper>

        {/* Results */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AssessmentIcon color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6">Results</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" gutterBottom>
            View completed batch runs, their status, and trigger evaluations.
          </Typography>
          <Button variant="contained" color="secondary">
            View Results
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
}
