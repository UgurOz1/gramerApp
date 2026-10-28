import type { TextStyle } from "react-native";

export const typography = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: "700" },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
