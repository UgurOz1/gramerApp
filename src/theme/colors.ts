/** Koyu tema renkleri. Metin/arka plan kontrastı WCAG AA'yı karşılar. */
export const colors = {
  background: "#101216",
  surface: "#1A1E25",
  surfaceAlt: "#242A33",
  border: "#2E3540",
  accent: "#8B9CFF",
  accentMuted: "#2B3260",
  onAccent: "#0D0F1A",
  success: "#55C995",
  successMuted: "#173A2B",
  danger: "#FF7777",
  dangerMuted: "#4A2024",
  warning: "#F2C46D",
  warningMuted: "#45371A",
  text: "#F4F5F7",
  textSecondary: "#A7AFBC",
  textMuted: "#7D8594",
} as const;

export type ColorName = keyof typeof colors;
