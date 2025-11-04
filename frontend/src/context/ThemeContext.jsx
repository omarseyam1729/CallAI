// src/context/ThemeContext.jsx
import React, { createContext, useMemo, useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Brand tokens
const brand = {
  primary:  { light: "#7FB8FF", main: "#2D7FFF", dark: "#1457C9" }, // azure/royal
  secondary:{ light: "#B79CFF", main: "#7E5BFF", dark: "#5634D4" }, // violet
  accent:   { main: "#00D0B3" },                                     // teal accent
  info:     { main: "#2CC1FF" },
  success:  { main: "#22C55E" },
  warning:  { main: "#F59E0B" },
  error:    { main: "#EF4444" },
};

const neutrals = {
  light: {
    bg:    "#F7F9FC",
    paper: "#FFFFFF",
    text:  "#0B1220",
    soft:  "#E9EEF5",
    divider: "rgba(11, 18, 32, 0.08)"
  },
  dark: {
    bg:    "#0C1220",
    paper: "#111827",
    text:  "#E5E7EB",
    soft:  "#1A2335",
    divider: "rgba(229, 231, 235, 0.10)"
  }
};

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

const getDesignTokens = (mode) => {
  const n = mode === "light" ? neutrals.light : neutrals.dark;

  return {
    palette: {
      mode,
      primary: brand.primary,
      secondary: brand.secondary,
      info: brand.info,
      success: brand.success,
      warning: brand.warning,
      error: brand.error,
      background: {
        default: n.bg,
        paper: n.paper,
      },
      text: {
        primary: n.text,
        secondary: mode === "light" ? "rgba(11,18,32,0.65)" : "rgba(229,231,235,0.72)",
      },
      divider: n.divider,
      // subtle hover/selected tones
      action: {
        hoverOpacity: 0.08,
        selectedOpacity: 0.12,
        focusOpacity: 0.12,
        disabledOpacity: 0.38,
      },
    },
    shape: {
      borderRadius: 14, // softer curves
    },
    typography: {
      fontFamily: [
        "Inter",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "Noto Sans",
        "Apple Color Emoji",
        "Segoe UI Emoji",
      ].join(","),
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shadows: [
      "none",
      "0 1px 2px rgba(0,0,0,0.06)",
      "0 2px 6px rgba(0,0,0,0.06)",
      "0 6px 14px rgba(0,0,0,0.08)",
      "0 10px 24px rgba(0,0,0,0.10)",
      ...Array(20).fill("0 10px 24px rgba(0,0,0,0.10)"),
    ],
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              mode === "light"
                ? `linear-gradient(90deg, ${brand.primary.dark} 0%, ${brand.secondary.main} 100%)`
                : `linear-gradient(90deg, #0F172A 0%, #1F2937 100%)`,
            boxShadow:
              mode === "light"
                ? "0 4px 12px rgba(45,127,255,0.25)"
                : "0 6px 18px rgba(0,0,0,0.35)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          containedPrimary: {
            background:
              mode === "light"
                ? `linear-gradient(180deg, ${brand.primary.main}, ${brand.primary.dark})`
                : `linear-gradient(180deg, #2D7FFF, #1457C9)`,
          },
          outlined: {
            borderColor: mode === "light" ? "#DBE5F0" : "#263042",
            background: mode === "light" ? "#fff" : "#111827",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: mode === "light" ? "#FFFFFF" : "linear-gradient(180deg, #0F172A, #0B1324)",
            border: `1px solid ${mode === "light" ? "#E6ECF5" : "#1E293B"}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background:
              mode === "light"
                ? "linear-gradient(180deg, #FFFFFF, #FAFBFF)"
                : "linear-gradient(180deg, #0F172A, #0C1220)",
            border: `1px solid ${mode === "light" ? "#EAF0F8" : "#1E293B"}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: mode === "light" ? "#FFFFFF" : "#0D1424",
            borderRight: `1px solid ${mode === "light" ? "#E6ECF5" : "#192033"}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            "&.Mui-selected": {
              backgroundColor: mode === "light" ? "rgba(45,127,255,0.10)" : "rgba(126,91,255,0.18)",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: 12,
            borderRadius: 8,
          },
        },
      },
    },
  };
};

export default function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState("light");

  // Optional: remember choice
  useEffect(() => {
    const saved = localStorage.getItem("callai-mode");
    if (saved) setMode(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("callai-mode", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({ toggleColorMode: () => setMode((p) => (p === "light" ? "dark" : "light")) }),
    []
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
