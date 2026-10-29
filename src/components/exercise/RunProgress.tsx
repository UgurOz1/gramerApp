import { StyleSheet, View } from "react-native";

import { AppText, ProgressBar } from "@/components/common";
import { colors, gradients, radius, spacing } from "@/theme";

type Props = {
  current: number;
  total: number;
  /** 0–1 arası doluluk. */
  value: number;
  /** Üst üste doğru sayısı; 2 ve üzeri olunca gösterilir. */
  combo?: number;
  label?: string;
};

/** Soru turlarının üstündeki ilerleme alanı. */
export function RunProgress({ current, total, value, combo = 0, label = "Soru" }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText variant="bodyStrong" color="textSecondary">
          {label} <AppText variant="bodyStrong">{current}</AppText> / {total}
        </AppText>
        {combo >= 2 ? (
          <View style={styles.combo} accessibilityLabel={`${combo} soru üst üste doğru`}>
            <AppText variant="caption" style={styles.comboText}>🔥 {combo} üst üste</AppText>
          </View>
        ) : null}
      </View>
      <ProgressBar value={value} height={12} color={combo >= 3 ? gradients.warm : gradients.primary} accessibilityLabel={`${label} ${current} / ${total}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  combo: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.warningMuted },
  comboText: { color: colors.warning, fontWeight: "800" },
});
