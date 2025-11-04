import React from "react";
import { Card, Typography, Stack, Box, Skeleton } from "@mui/material";
import { ResponsiveContainer } from "recharts";

export function ChartCard({ title, subtitle, height, children }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      <Box sx={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}

export function ChartSkeleton({ height = 320 }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="rectangular" height={height} sx={{ mt: 1, borderRadius: 2 }} />
    </Card>
  );
}
