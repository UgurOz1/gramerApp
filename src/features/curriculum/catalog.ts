import { getAvailableLessonIds, getCurriculum } from "@/data/contentRepository";
import type { Curriculum, LessonSummary, Level, LevelId, Unit } from "@/domain/models";

const EMPTY: Curriculum = { schemaVersion: 1, contentVersion: 0, levels: [], units: [], lessons: [] };

// Müfredat geçersizse (testler bunu engeller) boş katalog döner ve ekranlar çökmez.
const curriculum = getCurriculum() ?? EMPTY;

const levelById = new Map(curriculum.levels.map((l) => [l.id, l]));
const unitById = new Map(curriculum.units.map((u) => [u.id, u]));
const lessonById = new Map(curriculum.lessons.map((l) => [l.id, l]));
const availableLessonIds = new Set(getAvailableLessonIds());

export function isCatalogLoaded(): boolean {
  return curriculum !== EMPTY;
}

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
