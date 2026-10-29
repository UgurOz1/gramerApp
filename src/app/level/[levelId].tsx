import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Card, PageHero, ProgressBar, Screen } from "@/components/common";
import { LessonRow } from "@/components/progress/LessonRow";
import {
  getLessonSummary,
  getLessonsForLevel,
  getLessonsForUnit,
  getLevel,
  getUnitsForLevel,
  isLessonAvailable,
} from "@/features/curriculum/catalog";
import { levelProgress } from "@/features/progress/summary";
import { useMastery } from "@/features/progress/useMastery";
import { useUserState } from "@/services/progress/userStore";
import { formatPercent } from "@/utils/format";
import { levelTheme, spacing } from "@/theme";

export default function LevelScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const level = getLevel(levelId);
  const state = useUserState();
  const mastery = useMastery();

  if (!level) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Bulunamadı" }} />
        <AppText>Bu seviye bulunamadı.</AppText>
      </Screen>
    );
  }

  const theme = levelTheme(level.id);
  const lessons = getLessonsForLevel(level.id);
  const lp = levelProgress(lessons, state, mastery);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${level.code} · ${level.title}` }} />
      <PageHero emoji={theme.emoji} title={`${level.code} · ${level.title}`} subtitle={level.description} color={theme.color}>
        <View style={styles.heroStats}>
          <AppText variant="bodyStrong" style={{ color: theme.color }}>{formatPercent(lp.value)}</AppText>
          <AppText variant="caption" color="textSecondary">
            {lp.completed} / {lp.total} ders tamamlandı · {lp.available} konu hazır
          </AppText>
        </View>
        <ProgressBar value={lp.value} color={theme.gradient} accessibilityLabel={`${level.code} ilerleme`} />
      </PageHero>

      {getUnitsForLevel(level.id).map((unit) => {
        const unitLessons = getLessonsForUnit(unit.id);
        return (
          <Card key={unit.id} style={styles.unit}>
            <View style={styles.unitHead}>
              <View style={[styles.unitNo, { backgroundColor: theme.muted }]}>
                <AppText variant="label" style={{ color: theme.color }}>ÜNİTE {unit.order}</AppText>
              </View>
              <AppText variant="caption" color="textMuted">{unitLessons.length} konu</AppText>
            </View>
            <AppText variant="heading" accessibilityRole="header">{unit.title}</AppText>
            <View style={styles.list}>
              {unitLessons.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  index={i + 1}
                  lesson={lesson}
                  available={isLessonAvailable(lesson.id)}
                  progress={state.lessonProgress[lesson.id]}
                  mastery={mastery[lesson.id]}
                  prerequisiteTitles={lesson.prerequisiteIds
                    .map((id) => getLessonSummary(id)?.title)
                    .filter((t): t is string => !!t)}
                  isLast={i === unitLessons.length - 1}
                />
              ))}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroStats: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.sm },
  unit: { gap: spacing.md },
  unitHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  unitNo: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: 999 },
  list: { marginTop: spacing.sm },
});
