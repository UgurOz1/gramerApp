import { router } from "expo-router";

import { PageHero, Screen } from "@/components/common";
import { LevelCard } from "@/components/progress/LevelCard";
import { getCatalogStats, getLessonsForLevel, getLevels } from "@/features/curriculum/catalog";
import { levelProgress } from "@/features/progress/summary";
import { useMastery } from "@/features/progress/useMastery";
import { useUserState } from "@/services/progress/userStore";

export default function LevelsScreen() {
  const state = useUserState();
  const mastery = useMastery();
  const stats = getCatalogStats();
  return (
    <Screen>
      <PageHero
        emoji="🗺️"
        title="Müfredat"
        subtitle={`${stats.lessonCount} konu, ${stats.unitCount} ünite. Konular önerilen sıradadır ama hiçbiri kilitli değil; istediğini aç.`}
      />
      {getLevels().map((level) => {
        const lessons = getLessonsForLevel(level.id);
        const lp = levelProgress(lessons, state, mastery);
        return (
          <LevelCard
            key={level.id}
            level={level}
            lessonCount={lessons.length}
            showDescription
            progress={lp.value}
            detail={`${lp.completed} / ${lp.total} ders tamamlandı · ${lp.available} konu hazır`}
            onPress={() => router.push({ pathname: "/level/[levelId]", params: { levelId: level.id } })}
          />
        );
      })}
    </Screen>
  );
}
