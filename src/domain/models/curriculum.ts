export type LevelId = "a1" | "a2" | "b1" | "b2";

export type Level = {
  id: LevelId;
  code: string;
  title: string;
  description: string;
  order: number;
  unitIds: string[];
};

export type Unit = {
  id: string;
  levelId: LevelId;
  order: number;
  title: string;
  lessonIds: string[];
};

/** "comparison": iki veya daha fazla yapıyı karşılaştıran ders. */
export type LessonKind = "lesson" | "comparison";

/** Müfredat kataloğundaki ders özeti. Tam içerik ayrı ders dosyasındadır. */
export type LessonSummary = {
  id: string;
  levelId: LevelId;
  unitId: string;
  order: number;
  kind: LessonKind;
  title: string;
  summary: string;
  estimatedMinutes: number;
  prerequisiteIds: string[];
};

export type Curriculum = {
  schemaVersion: number;
  contentVersion: number;
  levels: Level[];
  units: Unit[];
  lessons: LessonSummary[];
};
