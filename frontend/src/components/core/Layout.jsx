// src/components/Layout.jsx
import React, { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Topbar from "./Topbar";
import Sidebar, { drawerWidth } from "./Sidebar";

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <Topbar onToggleSidebar={() => setOpen((v) => !v)} />

      {/* Sidebar slides using translateX; stays mounted */}
      <Sidebar open={open} />

      {/* Main shifts left margin between 0 and drawerWidth */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create("margin-left", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: open ? `${drawerWidth}px` : 0,
        })}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
