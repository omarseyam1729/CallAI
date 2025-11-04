import React from "react";
import { Card, Typography, LinearProgress, Box, useTheme } from "@mui/material";

export default function ProgressCard({ progress }) {
  const theme = useTheme();

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        mb: 4,
        p: { xs: 2.5, md: 3 },
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {/* Header */}
      <Typography
        variant="subtitle1"
        fontWeight={600}
        gutterBottom
        sx={{ color: "text.primary" }}
      >
        Processing Progress
      </Typography>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 12,
          borderRadius: 6,
          mt: 1,
          [`& .MuiLinearProgress-bar`]: {
            borderRadius: 6,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
          },
        }}
      />

      {/* Percentage */}
      <Box mt={1} display="flex" justifyContent="flex-end">
        <Typography variant="body2" fontWeight={500}>
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Card>
  );
}
