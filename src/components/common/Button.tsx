import { Pressable, StyleSheet, View } from "react-native";

import { colors, gradients, minTouchSize, radius, shadows, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "success";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  accessibilityHint?: string;
  icon?: IconName;
  /** Büyük, öne çıkan buton (ör. ekranın ana eylemi). */
  size?: "md" | "lg";
};

const fg: Record<Variant, string> = {
  primary: colors.onAccent,
  success: "#05261A",
  secondary: colors.text,
  ghost: colors.accent,
};

export function Button({ title, onPress, variant = "primary", disabled, accessibilityHint, icon, size = "md" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        size === "lg" && styles.lg,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {icon ? <Icon name={icon} size={size === "lg" ? 22 : 20} color={fg[variant]} /> : null}
        <AppText variant="bodyStrong" style={[styles.label, { color: fg[variant] }]}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchSize + 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { minHeight: 58, borderRadius: radius.lg },
  inner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontWeight: "700", textAlign: "center" },
  primary: { backgroundColor: colors.accentStrong, backgroundImage: gradients.primary, boxShadow: shadows.glow },
  success: { backgroundColor: colors.success, backgroundImage: gradients.success, boxShadow: shadows.glowSuccess },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong },
  ghost: { backgroundColor: "transparent" },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  disabled: { opacity: 0.4, boxShadow: "none" },
});
