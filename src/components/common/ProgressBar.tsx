import { StyleSheet, View } from "react-native";

import { colors, gradients, radius } from "@/theme";

type Props = {
  /** 0–1 arası değer. */
  value: number;
  /** Düz renk ya da CSS degrade dizgesi. Varsayılan: ana degrade. */
  color?: string;
  height?: number;
  trackColor?: string;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, color, height = 10, trackColor = colors.surfaceAlt, accessibilityLabel }: Props) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = Math.round(clamped * 100);
  const fill = color ?? gradients.primary;
  const isGradient = fill.startsWith("linear-gradient");
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      {percent > 0 ? (
        <View
          style={[
            styles.fill,
            { width: `${Math.max(percent, 3)}%` },
            isGradient ? { backgroundColor: colors.accentStrong, backgroundImage: fill } : { backgroundColor: fill },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
});
