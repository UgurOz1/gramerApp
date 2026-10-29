import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  emoji?: string;
  /** Ana renk; parıltı ve kenar için kullanılır. */
  color?: string;
  /** Degrade zemin dizgesi. */
  gradient?: string;
  children?: ReactNode;
};

/** Ekran başındaki renkli tanıtım alanı. */
export function PageHero({ title, subtitle, emoji, color = colors.accent, gradient, children }: Props) {
  return (
    <View
      style={[
        styles.hero,
        { borderColor: `${color}55`, backgroundImage: gradient ?? `linear-gradient(150deg, ${color}33 0%, ${colors.surface} 70%)` },
      ]}
    >
      <View style={[styles.orb, { backgroundImage: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }]} />
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <AppText variant="title" accessibilityRole="header">{title}</AppText>
      {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    boxShadow: shadows.card,
  },
  orb: { position: "absolute", width: 240, height: 240, right: -80, top: -100 },
  emoji: { fontSize: 40, lineHeight: 48, marginBottom: spacing.xs },
});
