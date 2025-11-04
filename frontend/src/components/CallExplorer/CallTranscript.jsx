import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

export default function CallTranscript({ transcript }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        maxHeight: 520,
        overflowY: "auto",
        mt: 2,
        typography: "body2",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}
    >
      {transcript && transcript.trim() ? (
        <Typography variant="body2" component="div">
          {transcript}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ opacity: 0.7, fontStyle: "italic" }}>
          No transcript found.
        </Typography>
      )}
    </Box>
  );
}

CallTranscript.propTypes = {
  transcript: PropTypes.string,
};

CallTranscript.defaultProps = {
  transcript: "",
};
