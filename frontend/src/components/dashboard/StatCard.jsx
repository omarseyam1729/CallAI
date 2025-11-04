import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Skeleton,
  useTheme,
} from "@mui/material";

export function StatCard({ icon, label, value }) {
  const theme = useTheme();

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Icon circle */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: theme.shadows[2],
              fontSize: 24,
            }}
          >
            {icon}
          </Box>

          {/* Text */}
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{ lineHeight: 1.3, mt: 0.5 }}
            >
              {value ?? "--"}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StatSkeleton() {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" height={30} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
