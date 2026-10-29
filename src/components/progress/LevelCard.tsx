import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, ProgressBar, icons } from "@/components/common";
import type { Level } from "@/domain/models";
import { colors, levelTheme, radius, spacing } from "@/theme";
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
  const theme = levelTheme(level.id);
  return (
    <Card onPress={onPress} accessibilityLabel={`${level.code} ${level.title}, ${lessonCount} konu`} style={styles.card}>
      <View style={[styles.glow, { backgroundImage: `radial-gradient(circle at 100% 0%, ${theme.color}33 0%, transparent 60%)` }]} />
      <View style={styles.row}>
        <View style={[styles.code, { backgroundColor: theme.color, backgroundImage: theme.gradient }]}>
          <AppText variant="heading" style={styles.codeText}>{level.code}</AppText>
        </View>
        <View style={styles.body}>
          <AppText variant="subheading">{level.title} {theme.emoji}</AppText>
          <AppText variant="caption" color="textSecondary">
            {level.unitIds.length} ünite · {lessonCount} konu
          </AppText>
        </View>
        {progress !== undefined ? (
          <AppText variant="subheading" style={{ color: theme.color }}>{formatPercent(progress)}</AppText>
        ) : (
          <Icon name={icons.chevronRight} color={colors.textMuted} size={20} />
        )}
      </View>
      {showDescription ? <AppText color="textSecondary">{level.description}</AppText> : null}
      {progress !== undefined ? (
        <View style={styles.progress}>
          <ProgressBar value={progress} color={theme.gradient} height={8} accessibilityLabel={`${level.code} ilerleme yüzde ${Math.round(progress * 100)}`} />
          {detail ? <AppText variant="caption" color="textSecondary">{detail}</AppText> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", gap: spacing.md },
  glow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  code: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: { color: "#0A0C16", fontWeight: "900" },
  body: { flex: 1, gap: 2 },
  progress: { gap: spacing.sm },
});
