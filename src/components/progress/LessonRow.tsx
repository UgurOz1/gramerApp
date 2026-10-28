import { StyleSheet, View } from "react-native";

import { AppText, Badge } from "@/components/common";
import type { LessonSummary } from "@/domain/models";
import { colors, spacing } from "@/theme";

type Props = {
  lesson: LessonSummary;
  available: boolean;
  prerequisiteTitles: string[];
  isLast: boolean;
};

/**
 * Müfredattaki tek konu satırı. İçeriği henüz hazır olmayan konular
 * dokunulabilir gösterilmez; Aşama 3'te ders ekranına bağlanacak.
 */
export function LessonRow({ lesson, available, prerequisiteTitles, isLast }: Props) {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.title}>
          {lesson.title}
        </AppText>
      </View>
      <AppText variant="caption" color="textSecondary">
        {lesson.summary}
      </AppText>
      <View style={styles.badges}>
        {lesson.kind === "comparison" ? <Badge label="Karşılaştırma" tone="accent" /> : null}
        <Badge label={`~${lesson.estimatedMinutes} dk`} />
        {!available ? <Badge label="İçerik hazırlanıyor" tone="warning" /> : null}
      </View>
      {prerequisiteTitles.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          Önce önerilen: {prerequisiteTitles.join(", ")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, gap: spacing.xs },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
});
