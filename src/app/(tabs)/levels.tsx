import { router } from "expo-router";

import { AppText, Screen } from "@/components/common";
import { LevelCard } from "@/components/progress/LevelCard";
import { getLessonsForLevel, getLevels } from "@/features/curriculum/catalog";

export default function LevelsScreen() {
  return (
    <Screen>
      <AppText color="textSecondary">
        Konular önerilen sıradadır ama hiçbiri kilitli değildir; istediğin konuyu açabilirsin.
      </AppText>
      {getLevels().map((level) => (
        <LevelCard
          key={level.id}
          level={level}
          lessonCount={getLessonsForLevel(level.id).length}
          showDescription
          onPress={() => router.push({ pathname: "/level/[levelId]", params: { levelId: level.id } })}
        />
      ))}
    </Screen>
  );
}
