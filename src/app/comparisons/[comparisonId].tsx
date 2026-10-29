import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, PageHero, Screen, icons } from "@/components/common";
import { ComparisonView } from "@/components/comparison/ComparisonView";
import { getComparison } from "@/data/contentRepository";
import { getLessonSummary, isLessonAvailable } from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { levelTheme, spacing } from "@/theme";

export default function ComparisonScreen() {
  const { comparisonId } = useLocalSearchParams<{ comparisonId: string }>();
  const comparison = getComparison(comparisonId);
  const summary = getLessonSummary(comparisonId);
  const { reviewList } = useUserState();
  const inReviewList = reviewList.some((r) => r.lessonId === comparisonId);

  useEffect(() => {
    if (comparison) progressService.openLesson(comparisonId);
  }, [comparison, comparisonId]);

  if (!comparison) {
    return (
      <Screen>
        <Stack.Screen options={{ title: summary?.title ?? "Karşılaştırma" }} />
        <Card>
          <AppText variant="heading">Bu karşılaştırma henüz hazır değil</AppText>
          <AppText color="textSecondary">İçeriği ileride eklenecek. Şimdilik hazır olan konulardan devam edebilirsin.</AppText>
        </Card>
      </Screen>
    );
  }

  const related = comparison.lessonIds.filter((id) => isLessonAvailable(id));

  return (
    <Screen
      onReachEnd={() => progressService.markLessonRead(comparisonId)}
      footer={
        <Button
          title="Mini testi çöz"
          icon={icons.play}
          size="lg"
          onPress={() => {
            progressService.markLessonRead(comparisonId);
            router.push({ pathname: "/practice/[lessonId]", params: { lessonId: comparisonId } });
          }}
        />
      }
    >
      <Stack.Screen options={{ title: comparison.title }} />
      <PageHero emoji="⚖️" title={comparison.title} color={levelTheme(comparison.levelId).color}>
        <View style={styles.badges}>
          <Badge label={comparison.levelId.toUpperCase()} color={{ bg: levelTheme(comparison.levelId).muted, fg: levelTheme(comparison.levelId).color }} />
          <Badge label="⇄ Karşılaştırma" tone="accent" />
          {summary ? <Badge label={`⏱ ${summary.estimatedMinutes} dk`} /> : null}
        </View>
      </PageHero>

      <Button
        title={inReviewList ? "Tekrar listemden çıkar" : "Tekrar listeme ekle"}
        icon={inReviewList ? icons.bookmark : icons.bookmarkAdd}
        variant="secondary"
        onPress={() => (inReviewList ? progressService.removeFromReviewList(comparisonId) : progressService.addToReviewList(comparisonId))}
      />

      <ComparisonView comparison={comparison} />

      {related.length > 0 ? (
        <Card>
          <AppText variant="heading" accessibilityRole="header">İlgili dersler</AppText>
          <AppText color="textSecondary">Bu yapıları ayrı ayrı öğrenmek için:</AppText>
          {related.map((id) => (
            <Button key={id} title={getLessonSummary(id)?.title ?? id} icon={icons.book} variant="secondary" onPress={() => router.push(lessonHref(id))} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
