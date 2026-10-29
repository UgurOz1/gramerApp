export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Erişilebilir asgari dokunma alanı (dp). */
export const minTouchSize = 48;

/** `boxShadow` stil dizgeleri. */
export const shadows = {
  card: "0px 8px 24px rgba(0, 0, 0, 0.35)",
  raised: "0px 12px 32px rgba(0, 0, 0, 0.45)",
  glow: "0px 10px 30px rgba(109, 93, 252, 0.45)",
  glowSuccess: "0px 10px 30px rgba(61, 220, 151, 0.35)",
} as const;
