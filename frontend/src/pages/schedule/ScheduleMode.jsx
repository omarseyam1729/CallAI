// src/pages/ScheduleMode.jsx
import React from "react";
import { Typography, Button, Card, CardContent } from "@mui/material";

export default function ScheduleMode() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Schedule Mode
      </Typography>
      <Typography variant="body1" gutterBottom>
        Set up recurring uploads from a folder at specific times.
      </Typography>
      <Button variant="contained">Create Schedule</Button>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6">Scheduled Jobs</Typography>
          <Typography variant="body2">[List of scheduled tasks will go here]</Typography>
        </CardContent>
      </Card>
    </div>
  );
}
