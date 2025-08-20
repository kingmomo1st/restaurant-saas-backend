// src/components/AdminThemeWrapper.jsx
import React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const adminTheme = createTheme({
  palette: {
    primary: {
      main: "#8B0000",
      light: "#A52A2A",
      dark: "#5D0000",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#C0A060",
      light: "#D4B070",
      dark: "#A68B45",
      contrastText: "#2E2E2E",
    },
    background: {
      default: "#F8F5F0",
      paper: "#ffffff",
    },
    text: {
      primary: "#2E2E2E",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: "'Lato', sans-serif",
    h1: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
    h2: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
    h3: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
    h4: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
    h5: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
    h6: { fontFamily: "'Playfair Display', serif", color: "#8B0000" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#2E2E2E",
          color: "#ffffff",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          textTransform: "none",
          fontWeight: 500,
        },
        contained: {
          "&:hover": {
            backgroundColor: "#C0A060",
            color: "#2E2E2E",
          },
        },
        outlined: {
          borderColor: "#C0A060",
          color: "#C0A060",
          "&:hover": {
            backgroundColor: "#C0A060",
            color: "#2E2E2E",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          "&.MuiChip-colorError": {
            backgroundColor: "#C0A060",
            color: "#2E2E2E",
          },
          "&.MuiChip-colorInfo": {
            backgroundColor: "#708238",
            color: "#ffffff",
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: "2px solid #C0A060",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#F8F5F0",
            color: "#8B0000",
          },
          "&.Mui-selected": {
            backgroundColor: "#C0A060",
            color: "#2E2E2E",
            fontWeight: "bold",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#C0A060",
          color: "#2E2E2E",
          fontWeight: "bold",
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: "#8B0000",
          color: "#ffffff",
        },
      },
    },
  },
});

const AdminThemeWrapper = ({ children }) => (
  <ThemeProvider theme={adminTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);

export default AdminThemeWrapper;