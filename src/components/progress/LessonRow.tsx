import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Badge, Icon, type BadgeTone } from "@/components/common";
import type { LessonProgress, LessonSummary, TopicMastery } from "@/domain/models";
import { getLessonStatus, lessonStatusLabels, type LessonStatus } from "@/domain/progress/lessonStatus";
import { masteryBandLabels } from "@/constants/labels";
import { colors, minTouchSize, spacing } from "@/theme";

type Props = {
  lesson: LessonSummary;
  available: boolean;
  progress: LessonProgress | undefined;
  mastery?: TopicMastery;
  prerequisiteTitles: string[];
  isLast: boolean;
};

const statusTone: Record<LessonStatus, BadgeTone> = {
  not_started: "neutral",
  learning: "accent",
  practice_done: "accent",
  exam_done: "success",
  review_needed: "warning",
  mastered: "success",
};

/**
 * Müfredattaki tek konu satırı. İçeriği hazır olan konular açılır;
 * henüz hazır olmayanlar dokunulabilir gösterilmez.
 */
export function LessonRow({ lesson, available, progress, mastery, prerequisiteTitles, isLast }: Props) {
  const status = getLessonStatus(progress, mastery);

  const body = (
    <>
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.title}>{lesson.title}</AppText>
        {available ? (
          <Icon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} color={colors.textMuted} size={18} />
        ) : null}
      </View>
      <AppText variant="caption" color="textSecondary">{lesson.summary}</AppText>
      <View style={styles.badges}>
        {lesson.kind === "comparison" ? <Badge label="Karşılaştırma" tone="accent" /> : null}
        <Badge label={`~${lesson.estimatedMinutes} dk`} />
        {available ? <Badge label={lessonStatusLabels[status]} tone={statusTone[status]} /> : <Badge label="İçerik hazırlanıyor" tone="warning" />}
        {available && mastery && mastery.band !== "not_enough_data" ? (
          <Badge label={`Ustalık: ${masteryBandLabels[mastery.band]} (${mastery.score})`} tone={mastery.band === "strong" ? "success" : mastery.band === "needs_work" ? "danger" : "neutral"} />
        ) : null}
      </View>
      {prerequisiteTitles.length > 0 ? (
        <AppText variant="caption" color="textMuted">Önce önerilen: {prerequisiteTitles.join(", ")}</AppText>
      ) : null}
    </>
  );

  const rowStyle = [styles.row, !isLast && styles.divider];

  if (!available) return <View style={rowStyle}>{body}</View>;
  return (
    <Pressable
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${lesson.title}. ${lessonStatusLabels[status]}`}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, gap: spacing.xs, minHeight: minTouchSize },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { opacity: 0.7 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
});
