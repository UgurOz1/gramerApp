import { router } from "expo-router";
import { View } from "react-native";

import { AppText, Badge, Card, Icon, PageHero, Screen, SectionHeader, icons } from "@/components/common";
import { lessonStatusLabels, getLessonStatus } from "@/domain/progress/lessonStatus";
import { getLessonsForLevel, getLevels, isLessonAvailable } from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
import { useMastery } from "@/features/progress/useMastery";
import { useUserState } from "@/services/progress/userStore";
import { colors, levelTheme, spacing } from "@/theme";

/** Benzer yapıları karşılaştıran tüm dersler, seviyeye göre. */
export default function ComparisonsScreen() {
  const { lessonProgress } = useUserState();
  const mastery = useMastery();

  return (
    <Screen>
      <PageHero
        emoji="⚖️"
        title="Karşılaştırmalı gramer"
        subtitle="Birbirine benzeyen yapıları yan yana öğren. Her karşılaştırmanın sonunda hangisini seçeceğini ölçen bir mini test var."
      />
      {getLevels().map((level) => {
        const comparisons = getLessonsForLevel(level.id).filter((l) => l.kind === "comparison");
        if (comparisons.length === 0) return null;
        return (
          <View key={level.id} style={{ gap: spacing.md }}>
            <SectionHeader title={`${levelTheme(level.id).emoji} ${level.code} · ${level.title}`} />
            {comparisons.map((c) => {
              const available = isLessonAvailable(c.id);
              const status = getLessonStatus(lessonProgress[c.id], mastery[c.id]);
              return (
                <Card key={c.id} onPress={available ? () => router.push(lessonHref(c.id)) : undefined} accessibilityLabel={c.title} accentColor={levelTheme(level.id).color}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <AppText variant="subheading" style={{ flex: 1, opacity: available ? 1 : 0.55 }}>{c.title}</AppText>
                    {available ? <Icon name={icons.chevronRight} color={colors.textMuted} size={18} /> : null}
                  </View>
                  <AppText variant="caption" color="textSecondary">{c.summary}</AppText>
                  <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                    <Badge label={`~${c.estimatedMinutes} dk`} />
                    {available ? <Badge label={lessonStatusLabels[status]} tone="accent" /> : <Badge label="Yakında" />}
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
