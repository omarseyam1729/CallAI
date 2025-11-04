// src/components/Topbar.jsx
import React, { useContext } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExploreIcon from "@mui/icons-material/Explore";          // NEW

import { ColorModeContext } from "../../context/ThemeContext";

export default function Topbar({ onToggleSidebar }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colorMode = useContext(ColorModeContext);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // make action optional to avoid "?action=undefined"
  const toExplorer = (action) =>
    navigate(`/explorer${action ? `?action=${action}` : ""}`);

  // NEW: batches navigator
  const toBatches  = (q) => navigate(`/batches${q ? `?${q}` : ""}`);
  const toTriggers = () => navigate("/triggers");

  const ActionBtn = (props) => (
    <Button
      color="inherit"
      size="small"
      sx={{ fontWeight: 600, opacity: 0.95 }}
      {...props}
    />
  );

  const renderModeActions = () => {
    if (pathname.startsWith("/explorer")) {
      return (
        <>
          {/* NEW: Explore -> call list view (your /calls endpoint backs this) */}
    
          <ActionBtn startIcon={<UploadFileIcon />} onClick={() => toExplorer("upload")}>
            Upload Call
          </ActionBtn>
          <ActionBtn startIcon={<ExploreIcon />} onClick={() => toExplorer("list")}>
            Explore
          </ActionBtn>
          <ActionBtn startIcon={<SearchIcon />} onClick={() => toExplorer("search")}>
            Search Calls
          </ActionBtn>
          <ActionBtn startIcon={<TravelExploreIcon />} onClick={() => toExplorer("semantic")}>
            Semantic Search
          </ActionBtn>
        </>
      );
    }
    // UPDATED: actions for /batches
    if (pathname.startsWith("/batches")) {
      return (
        <>
          <ActionBtn startIcon={<AddIcon />} onClick={() => toBatches("create=1")}>
            New Batch
          </ActionBtn>
          <ActionBtn startIcon={<RefreshIcon />} onClick={() => toBatches()}>
            All Batches
          </ActionBtn>
        </>
      );
    }
    // legacy support if you still navigate with /batch
    if (pathname.startsWith("/batch")) {
      return (
        <>
          <ActionBtn onClick={() => navigate("/batches")}>Batches</ActionBtn>
        </>
      );
    }
    return null;
  };

  const pillSx = {
    color: theme.palette.common.white,
    borderColor: alpha(theme.palette.common.white, 0.45),
    backgroundColor: alpha(theme.palette.common.white, 0.06),
    "&:hover": {
      borderColor: alpha(theme.palette.common.white, 0.85),
      backgroundColor: alpha(theme.palette.common.white, 0.12),
    },
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {/* Left: Hamburger + Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton color="inherit" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>CallAI</Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {renderModeActions()}

          {/* Persistent Batches entry point */}
          <Button
            variant="outlined"
            size="small"
            sx={pillSx}
            onClick={() => toBatches()}
          >
            Batches
          </Button>

          {/* Persistent: My Triggers */}
          <Button
            variant="outlined"
            size="small"
            sx={pillSx}
            onClick={toTriggers}
          >
            My Triggers
          </Button>

          {/* Persistent: Help */}
          <Tooltip title="Help">
            <IconButton color="inherit" aria-label="Help">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
            <IconButton color="inherit" onClick={colorMode.toggleColorMode} aria-label="Toggle theme">
              {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Avatar
            alt="Profile"
            src="/profile.png"
            sx={{
              width: 32,
              height: 32,
              border: `1px solid ${alpha(theme.palette.common.white, 0.35)}`,
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
