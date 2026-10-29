/** Koyu tema renkleri. Metin/arka plan kontrastı WCAG AA'yı karşılar. */
export const colors = {
  background: "#0A0C16",
  surface: "#141829",
  surfaceAlt: "#1D2238",
  surfaceRaised: "#252B45",
  border: "#2A3150",
  borderStrong: "#3A4370",
  accent: "#8E83FF",
  accentStrong: "#6D5DFC",
  accentMuted: "#262558",
  onAccent: "#FFFFFF",
  success: "#3DDC97",
  successMuted: "#123A2E",
  danger: "#FF7A8A",
  dangerMuted: "#43192A",
  warning: "#FFC861",
  warningMuted: "#45341A",
  info: "#5CC8FF",
  infoMuted: "#14324A",
  text: "#F5F6FB",
  textSecondary: "#AEB4CE",
  textMuted: "#7880A3",
} as const;

export type ColorName = keyof typeof colors;

/** CSS linear-gradient dizgeleri; `backgroundImage` stiliyle kullanılır. */
export const gradients = {
  primary: "linear-gradient(135deg, #7B6CFF 0%, #5B8CFF 100%)",
  hero: "linear-gradient(150deg, #3B2F9E 0%, #2A2470 45%, #141829 100%)",
  success: "linear-gradient(135deg, #22C58B 0%, #3DDC97 100%)",
  danger: "linear-gradient(135deg, #F0546C 0%, #FF7A8A 100%)",
  warm: "linear-gradient(135deg, #FF9F43 0%, #FF6B8B 100%)",
  surface: "linear-gradient(180deg, #1A1F35 0%, #141829 100%)",
} as const;

export type LevelTheme = {
  /** Ana renk (metin, ikon, çubuk). */
  color: string;
  /** Koyu, düşük doygunluklu zemin. */
  muted: string;
  gradient: string;
  emoji: string;
};

/** Her seviyenin kendine özgü rengi; seviye kimliği küçük harfle anahtarlanır. */
export const levelThemes: Record<string, LevelTheme> = {
  a1: { color: "#3DDC97", muted: "#123A2E", gradient: "linear-gradient(135deg, #10B981 0%, #3DDC97 100%)", emoji: "🌱" },
  a2: { color: "#5CC8FF", muted: "#14324A", gradient: "linear-gradient(135deg, #0EA5E9 0%, #5CC8FF 100%)", emoji: "🚀" },
  b1: { color: "#B79CFF", muted: "#2C2158", gradient: "linear-gradient(135deg, #7C4DFF 0%, #B79CFF 100%)", emoji: "⚡" },
  b2: { color: "#FF9F6B", muted: "#45261A", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFB36B 100%)", emoji: "🏆" },
};

export function levelTheme(levelId: string): LevelTheme {
  return levelThemes[levelId.toLowerCase()] ?? levelThemes.a1;
}
