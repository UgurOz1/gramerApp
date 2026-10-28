import rawCurriculum from "@/assets/data/curriculum.json";
import type { Curriculum, LessonSummary, Level, LevelId, Unit } from "@/domain/models";

// JSON'un tam doğrulaması Aşama 2'de içerik doğrulayıcıyla eklenecek.
const curriculum = rawCurriculum as Curriculum;

const levelById = new Map(curriculum.levels.map((l) => [l.id, l]));
const unitById = new Map(curriculum.units.map((u) => [u.id, u]));
const lessonById = new Map(curriculum.lessons.map((l) => [l.id, l]));

/** Tam içeriği hazırlanmış derslerin kimlikleri. Aşama 3'ten itibaren dolacak. */
const availableLessonIds = new Set<string>();

export function getLevels(): Level[] {
  return [...curriculum.levels].sort((a, b) => a.order - b.order);
}

export function getLevel(id: string): Level | undefined {
  return levelById.get(id as LevelId);
}

export function getUnitsForLevel(levelId: LevelId): Unit[] {
  const level = levelById.get(levelId);
  if (!level) return [];
  return level.unitIds.map((id) => unitById.get(id)).filter((u): u is Unit => !!u);
}

export function getLessonsForUnit(unitId: string): LessonSummary[] {
  const unit = unitById.get(unitId);
  if (!unit) return [];
  return unit.lessonIds
    .map((id) => lessonById.get(id))
    .filter((l): l is LessonSummary => !!l);
}

export function getLessonsForLevel(levelId: LevelId): LessonSummary[] {
  return getUnitsForLevel(levelId).flatMap((u) => getLessonsForUnit(u.id));
}

export function getLessonSummary(id: string): LessonSummary | undefined {
  return lessonById.get(id);
}

export function isLessonAvailable(id: string): boolean {
  return availableLessonIds.has(id);
}

export function getCatalogStats() {
  return {
    levelCount: curriculum.levels.length,
    unitCount: curriculum.units.length,
    lessonCount: curriculum.lessons.length,
    availableLessonCount: availableLessonIds.size,
  };
}
