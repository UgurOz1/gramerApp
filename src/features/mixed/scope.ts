import type { Curriculum, LevelId, MistakeRecord, ReviewItem } from "@/domain/models";

export type MixedScope =
  | { kind: "all" }
  | { kind: "level"; levelId: LevelId }
  | { kind: "units"; unitIds: string[] }
  | { kind: "lessons"; lessonIds: string[] }
  | { kind: "mistakes" }
  | { kind: "review" };

/** Kapsama giren, içeriği hazır dersler (müfredat sırasıyla). */
export function resolveScopeLessons(
  scope: MixedScope,
  ctx: {
    curriculum: Curriculum;
    availableLessonIds: Set<string>;
    mistakes: Record<string, MistakeRecord>;
    reviewList: ReviewItem[];
  },
): string[] {
  const ordered = ctx.curriculum.levels
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((level) =>
      level.unitIds.flatMap((uid) => ctx.curriculum.units.find((u) => u.id === uid)?.lessonIds ?? []),
    )
    .filter((id) => ctx.availableLessonIds.has(id));

  switch (scope.kind) {
    case "all":
      return ordered;
    case "level": {
      const level = ctx.curriculum.levels.find((l) => l.id === scope.levelId);
      const inLevel = new Set(
        (level?.unitIds ?? []).flatMap((uid) => ctx.curriculum.units.find((u) => u.id === uid)?.lessonIds ?? []),
      );
      return ordered.filter((id) => inLevel.has(id));
    }
    case "units": {
      const inUnits = new Set(scope.unitIds.flatMap((uid) => ctx.curriculum.units.find((u) => u.id === uid)?.lessonIds ?? []));
      return ordered.filter((id) => inUnits.has(id));
    }
    case "lessons": {
      const chosen = new Set(scope.lessonIds);
      return ordered.filter((id) => chosen.has(id));
    }
    case "mistakes": {
      const withMistakes = new Set(
        Object.values(ctx.mistakes)
          .filter((m) => !m.dismissed && !m.resolved)
          .map((m) => m.lessonId),
      );
      return ordered.filter((id) => withMistakes.has(id));
    }
    case "review": {
      const listed = new Set(ctx.reviewList.map((r) => r.lessonId));
      return ordered.filter((id) => listed.has(id));
    }
  }
}
