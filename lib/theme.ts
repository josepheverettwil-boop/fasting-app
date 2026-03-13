export const colors = {
  background: "#0B0B1E",
  backgroundLight: "#111132",
  card: "#151530",
  cardBorder: "#252545",
  primary: "#FF6B35",
  primaryDim: "rgba(255, 107, 53, 0.15)",
  secondary: "#00D4AA",
  secondaryDim: "rgba(0, 212, 170, 0.15)",
  accent: "#7C5CFC",
  accentDim: "rgba(124, 92, 252, 0.15)",
  warning: "#FFD93D",
  error: "#FF4757",
  textPrimary: "#FFFFFF",
  textSecondary: "#8B8BA7",
  textMuted: "#555577",
  inputBackground: "#1A1A3E",
  inputBorder: "#2A2A5A",
  divider: "#1E1E40",
  overlay: "rgba(0, 0, 0, 0.6)",
} as const;

export const moodColors = [
  "#FF4757", // 1 - Very Low
  "#FF6B35", // 2 - Low
  "#FFD93D", // 3 - Neutral
  "#00D4AA", // 4 - Good
  "#00B4D8", // 5 - Great
] as const;

export const moodLabels = [
  "Struggling",
  "Low Energy",
  "Neutral",
  "Good",
  "Energized",
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 48,
  hero: 64,
} as const;
