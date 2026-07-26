export const theme = {
  colors: {
    bg: "#000",
    surface: "#0a0a0a",
    surfaceAlt: "#161616",
    border: "#262626",
    text: "#fff",
    textMuted: "#aaa",
    accent: "#4aabff",
    danger: "#ff453a",
    overlay: "rgba(0,0,0,0.4)",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fab: { size: 60, bottomOffset: 72 },
  radius: { sm: 8, md: 12, lg: 16, full: 9999 },
  font: { sm: 13, md: 15, lg: 17, xl: 22 },
} as const;

export type Theme = typeof theme;
