// src/components/Sidebar.jsx
import React from "react";
import { styled } from "@mui/material/styles";
import { Drawer as MuiDrawer, Toolbar, Box, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import PeopleIcon from "@mui/icons-material/People"; 
import { useNavigate, useLocation } from "react-router-dom";

export const drawerWidth = 240;

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    // smooth slide animation
    transition: theme.transitions.create(["transform", "box-shadow"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();



// inside items array
const items = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { text: "Batch Mode", icon: <StorageIcon />, path: "/batches" },
  { text: "Schedule Mode", icon: <ScheduleIcon />, path: "/schedule" },
  { text: "Call Explorer", icon: <HeadsetMicIcon />, path: "/explorer" },
  { text: "Agents", icon: <PeopleIcon />, path: "/agents" }, 
];


  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          transform: open ? "translateX(0)" : `translateX(-${drawerWidth}px)`,
          boxShadow: open ? 3 : "none",
        },
      }}
      open // keep mounted for smoothness
    >
      <Toolbar sx={{ justifyContent: "center" }}>
        <Box component="img" src="/logo.png" alt="CallAI" sx={{ height: 32 }} />
      </Toolbar>

      <List sx={{ px: 1 }}>
        {items.map((it) => {
          const selected = pathname === it.path;
          return (
            <ListItemButton
              key={it.text}
              selected={selected}
              onClick={() => navigate(it.path)}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.text} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
