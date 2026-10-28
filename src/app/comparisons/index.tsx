import { router } from "expo-router";
import { View } from "react-native";

import { AppText, Badge, Card, Screen, SectionHeader } from "@/components/common";
import { lessonStatusLabels, getLessonStatus } from "@/domain/progress/lessonStatus";
import { getLessonsForLevel, getLevels, isLessonAvailable } from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
import { useMastery } from "@/features/progress/useMastery";
import { useUserState } from "@/services/progress/userStore";
import { spacing } from "@/theme";

/** Benzer yapıları karşılaştıran tüm dersler, seviyeye göre. */
export default function ComparisonsScreen() {
  const { lessonProgress } = useUserState();
  const mastery = useMastery();

  return (
    <Screen>
      <AppText color="textSecondary">
        Birbirine benzeyen yapıları yan yana öğren. Her karşılaştırmanın sonunda hangisini seçeceğini ölçen bir mini test vardır.
      </AppText>
      {getLevels().map((level) => {
        const comparisons = getLessonsForLevel(level.id).filter((l) => l.kind === "comparison");
        if (comparisons.length === 0) return null;
        return (
          <View key={level.id} style={{ gap: spacing.md }}>
            <SectionHeader title={`${level.code} · ${level.title}`} />
            {comparisons.map((c) => {
              const available = isLessonAvailable(c.id);
              const status = getLessonStatus(lessonProgress[c.id], mastery[c.id]);
              return (
                <Card key={c.id} onPress={available ? () => router.push(lessonHref(c.id)) : undefined} accessibilityLabel={c.title}>
                  <AppText variant="subheading">{c.title}</AppText>
                  <AppText variant="caption" color="textSecondary">{c.summary}</AppText>
                  <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                    <Badge label={`~${c.estimatedMinutes} dk`} />
                    {available ? <Badge label={lessonStatusLabels[status]} tone="accent" /> : <Badge label="İçerik hazırlanıyor" tone="warning" />}
                  </View>
                </Card>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}
