import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Badge, Icon, icons, type BadgeTone } from "@/components/common";
import type { LessonProgress, LessonSummary, TopicMastery } from "@/domain/models";
import { getLessonStatus, lessonStatusLabels, type LessonStatus } from "@/domain/progress/lessonStatus";
import { lessonHref } from "@/features/curriculum/routes";
import { masteryBandLabels } from "@/constants/labels";
import { colors, levelTheme, minTouchSize, spacing } from "@/theme";

type Props = {
  lesson: LessonSummary;
  available: boolean;
  progress: LessonProgress | undefined;
  mastery?: TopicMastery;
  prerequisiteTitles: string[];
  isLast: boolean;
  /** Ünite içindeki sıra numarası (1'den başlar). */
  index: number;
};

const statusTone: Record<LessonStatus, BadgeTone> = {
  not_started: "neutral",
  learning: "accent",
  practice_done: "info",
  exam_done: "success",
  review_needed: "warning",
  mastered: "success",
};

/**
 * Müfredattaki tek konu satırı; dikey bir yol üzerindeki durak gibi çizilir.
 * İçeriği hazır olan konular açılır; henüz hazır olmayanlar dokunulabilir gösterilmez.
 */
export function LessonRow({ lesson, available, progress, mastery, prerequisiteTitles, isLast, index }: Props) {
  const status = getLessonStatus(progress, mastery);
  const theme = levelTheme(lesson.levelId);
  const done = status === "mastered" || status === "exam_done" || status === "practice_done";
  const started = status !== "not_started";

  const node = (
    <View style={styles.rail}>
      <View
        style={[
          styles.node,
          !available && styles.nodeLocked,
          available && !started && { borderColor: theme.color },
          started && !done && { backgroundColor: theme.muted, borderColor: theme.color },
          done && { backgroundColor: theme.color, borderColor: theme.color, backgroundImage: theme.gradient },
        ]}
      >
        {done ? (
          <Icon name={icons.check} size={18} color="#0A0C16" />
        ) : !available ? (
          <AppText style={styles.lockEmoji}>🔒</AppText>
        ) : (
          <AppText variant="bodyStrong" style={{ color: theme.color }}>{index}</AppText>
        )}
      </View>
      {!isLast ? <View style={[styles.line, done && { backgroundColor: theme.color }]} /> : null}
    </View>
  );

  const body = (
    <View style={[styles.body, !isLast && styles.bodySpacing]}>
      <View style={styles.header}>
        <AppText variant="subheading" style={[styles.title, !available && styles.dim]}>{lesson.title}</AppText>
        {available ? <Icon name={icons.chevronRight} color={colors.textMuted} size={18} /> : null}
      </View>
      <AppText variant="caption" color="textSecondary" style={!available && styles.dim}>{lesson.summary}</AppText>
      <View style={styles.badges}>
        {lesson.kind === "comparison" ? <Badge label="⇄ Karşılaştırma" tone="accent" /> : null}
        <Badge label={`⏱ ${lesson.estimatedMinutes} dk`} />
        {available ? <Badge label={lessonStatusLabels[status]} tone={statusTone[status]} /> : <Badge label="Yakında" tone="neutral" />}
        {available && mastery && mastery.band !== "not_enough_data" ? (
          <Badge label={`${masteryBandLabels[mastery.band]} · ${mastery.score}`} tone={mastery.band === "strong" ? "success" : mastery.band === "needs_work" ? "danger" : "neutral"} />
        ) : null}
      </View>
      {prerequisiteTitles.length > 0 && available ? (
        <AppText variant="caption" color="textMuted">Önce önerilen: {prerequisiteTitles.join(", ")}</AppText>
      ) : null}
    </View>
  );

  if (!available) {
    return (
      <View style={styles.row}>
        {node}
        {body}
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(lessonHref(lesson.id))}
      accessibilityRole="button"
      accessibilityLabel={`${lesson.title}. ${lessonStatusLabels[status]}`}
    >
      {node}
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, minHeight: minTouchSize },
  pressed: { opacity: 0.7 },
  rail: { alignItems: "center", width: 40 },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLocked: { borderColor: colors.border, backgroundColor: colors.background },
  lockEmoji: { fontSize: 14, lineHeight: 18, opacity: 0.6 },
  line: { flex: 1, width: 2, minHeight: 16, backgroundColor: colors.border, marginVertical: 4 },
  body: { flex: 1, gap: spacing.xs, paddingTop: spacing.sm },
  bodySpacing: { paddingBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
  dim: { opacity: 0.55 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
});
