import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Card, Screen, SectionHeader } from "@/components/common";
import { LessonRow } from "@/components/progress/LessonRow";
import {
  getLessonSummary,
  getLessonsForUnit,
  getLevel,
  getUnitsForLevel,
  isLessonAvailable,
} from "@/features/curriculum/catalog";
import { spacing } from "@/theme";

export default function LevelScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const level = getLevel(levelId);

  if (!level) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Bulunamadı" }} />
        <AppText>Bu seviye bulunamadı.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${level.code} · ${level.title}` }} />
      <AppText color="textSecondary">{level.description}</AppText>
      {getUnitsForLevel(level.id).map((unit) => (
        <View key={unit.id} style={styles.unit}>
          <SectionHeader title={`Ünite ${unit.order}: ${unit.title}`} />
          <Card style={styles.list}>
            {getLessonsForUnit(unit.id).map((lesson, i) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                available={isLessonAvailable(lesson.id)}
                prerequisiteTitles={lesson.prerequisiteIds
                  .map((id) => getLessonSummary(id)?.title)
                  .filter((t): t is string => !!t)}
                isLast={i === unit.lessonIds.length - 1}
              />
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  unit: { gap: spacing.md },
  list: { paddingVertical: spacing.xs, gap: 0 },
});
