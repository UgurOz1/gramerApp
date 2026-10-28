import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, ProgressBar } from "@/components/common";
import type { Level } from "@/domain/models";
import { colors, radius, spacing } from "@/theme";
import { formatPercent } from "@/utils/format";

type Props = {
  level: Level;
  lessonCount: number;
  showDescription?: boolean;
  /** 0–1 arası seviye ilerlemesi. Verilirse ilerleme çubuğu gösterilir. */
  progress?: number;
  detail?: string;
  onPress: () => void;
};

export function LevelCard({ level, lessonCount, showDescription, progress, detail, onPress }: Props) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${level.code} ${level.title}, ${lessonCount} konu`}>
      <View style={styles.row}>
        <View style={styles.code}>
          <AppText variant="subheading" color="accent">
            {level.code}
          </AppText>
        </View>
        <View style={styles.body}>
          <AppText variant="subheading">{level.title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {level.unitIds.length} ünite · {lessonCount} konu
          </AppText>
        </View>
        <Icon
          name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
          color={colors.textMuted}
          size={20}
        />
      </View>
      {showDescription ? <AppText color="textSecondary">{level.description}</AppText> : null}
      {progress !== undefined ? (
        <>
          <ProgressBar value={progress} accessibilityLabel={`${level.code} ilerleme yüzde ${Math.round(progress * 100)}`} />
          <AppText variant="caption" color="textSecondary">{formatPercent(progress)}{detail ? ` · ${detail}` : ""}</AppText>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  code: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
});
