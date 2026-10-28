import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, { bg: string; fg: keyof typeof colors }> = {
  neutral: { bg: colors.surfaceAlt, fg: "textSecondary" },
  accent: { bg: colors.accentMuted, fg: "accent" },
  success: { bg: colors.successMuted, fg: "success" },
  warning: { bg: colors.warningMuted, fg: "warning" },
  danger: { bg: colors.dangerMuted, fg: "danger" },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <AppText variant="caption" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
