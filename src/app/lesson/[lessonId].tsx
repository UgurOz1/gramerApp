import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Screen } from "@/components/common";
import { SectionView } from "@/components/lesson/SectionView";
import { getLessonContent } from "@/data/contentRepository";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { spacing } from "@/theme";

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const summary = getLessonSummary(lessonId);
  const { preferences } = useUserState();
  const [sessionId] = useState(() => progressService.newSessionId());

  useEffect(() => {
    if (lesson) progressService.openLesson(lessonId);
  }, [lesson, lessonId]);

  if (!lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: summary?.title ?? "Ders" }} />
        <Card>
          <AppText variant="heading">Bu ders henüz hazır değil</AppText>
          <AppText color="textSecondary">Bu konunun içeriği ileride eklenecek. Şimdilik hazır olan derslerden devam edebilirsin.</AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      onReachEnd={() => progressService.markLessonRead(lessonId)}
      footer={
        <>
          <Button
            title="Alıştırmalara geç"
            onPress={() => {
              progressService.markLessonRead(lessonId);
              router.push({ pathname: "/practice/[lessonId]", params: { lessonId } });
            }}
          />
          <Button
            title="Doğrudan konu sonu sınavına git"
            variant="ghost"
            onPress={() => router.push({ pathname: "/exam/[lessonId]", params: { lessonId } })}
          />
        </>
      }
    >
      <Stack.Screen options={{ title: lesson.title }} />
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">{lesson.title}</AppText>
        <View style={styles.badges}>
          <Badge label={lesson.levelId.toUpperCase()} tone="accent" />
          {summary ? <Badge label={`~${summary.estimatedMinutes} dk`} /> : null}
        </View>
      </View>

      <Card>
        <AppText variant="subheading">Bu derste öğreneceklerin</AppText>
        {lesson.objectives.map((o) => (
          <View key={o} style={styles.bullet}>
            <AppText color="accent">•</AppText>
            <AppText style={styles.bulletText}>{o}</AppText>
          </View>
        ))}
      </Card>

      {lesson.sections.map((section) => (
        <SectionView key={section.id} section={section} lesson={lesson} sessionId={sessionId} showHint={preferences.showHints} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  badges: { flexDirection: "row", gap: spacing.sm },
  bullet: { flexDirection: "row", gap: spacing.sm },
  bulletText: { flex: 1 },
});
