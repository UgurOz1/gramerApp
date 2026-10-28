import { Pressable, StyleSheet } from "react-native";

import { colors, minTouchSize, radius, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** Seçilebilir etiket. Seçili durum yalnızca renkle değil onay işaretiyle de belirtilir. */
export function Chip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={selected ? `${label}, seçili` : label}
      style={({ pressed }) => [styles.chip, selected && styles.selected, disabled && styles.disabled, pressed && styles.pressed]}
    >
      {selected ? <Icon name={{ ios: "checkmark", android: "check", web: "check" }} color={colors.accent} size={16} /> : null}
      <AppText variant="bodyStrong" color={selected ? "accent" : "textSecondary"}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchSize - 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selected: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
});
