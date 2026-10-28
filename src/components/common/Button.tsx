import { Pressable, StyleSheet } from "react-native";

import { colors, minTouchSize, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Button({ title, onPress, variant = "primary", disabled, accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="bodyStrong" color={variant === "primary" ? "onAccent" : "accent"}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchSize,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.accentMuted },
  ghost: { backgroundColor: "transparent" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});
