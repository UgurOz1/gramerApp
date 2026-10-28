import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";

type Props = {
  /** 0–1 arası değer. */
  value: number;
  color?: string;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, color = colors.accent, accessibilityLabel }: Props) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = Math.round(clamped * 100);
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
});
