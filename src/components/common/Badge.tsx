import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  accent: { bg: colors.accentMuted, fg: colors.accent },
  success: { bg: colors.successMuted, fg: colors.success },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  danger: { bg: colors.dangerMuted, fg: colors.danger },
  info: { bg: colors.infoMuted, fg: colors.info },
};

type Props = {
  label: string;
  tone?: BadgeTone;
  /** Özel renk (ör. seviye rengi); tone'u geçersiz kılar. */
  color?: { bg: string; fg: string };
};

export function Badge({ label, tone = "neutral", color }: Props) {
  const t = color ?? toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <AppText variant="caption" style={[styles.text, { color: t.fg }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontWeight: "700" },
});
