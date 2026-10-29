import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** "flat": gölgesiz, iç içe kullanım için. */
  variant?: "default" | "flat";
  /** Kartın sol kenarında ince renkli şerit. */
  accentColor?: string;
};

export function Card({ children, onPress, accessibilityLabel, style, variant = "default", accentColor }: Props) {
  const base = [styles.card, variant === "flat" && styles.flat, accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null];
  if (!onPress) {
    return <View style={[base, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.card,
  },
  flat: { boxShadow: "none", backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
  pressed: { transform: [{ scale: 0.985 }], backgroundColor: colors.surfaceAlt },
});
