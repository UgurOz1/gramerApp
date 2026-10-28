import rawCurriculum from "@/assets/data/curriculum.json";
import type { Comparison, Curriculum, LessonContent, Question } from "@/domain/models";
import type { ValidationIssue } from "@/domain/validation/result";
import {
  findDuplicateQuestionIds,
  formatIssues,
  validateComparison,
  validateCurriculum,
  validateLessonContent,
} from "@/domain/validation/validateContent";

import { comparisonFiles } from "./comparisonFiles";
import { lessonFiles } from "./lessonFiles";

type ContentState = {
  curriculum: Curriculum | null;
  lessons: Map<string, LessonContent>;
  comparisons: Map<string, Comparison>;
  issues: ValidationIssue[];
};

let cache: ContentState | null = null;

/**
 * Paketlenmiş içeriği bir kez yükler ve doğrular. Geçersiz bir ders dosyası
 * uygulamayı çökertmez: o ders "hazır değil" sayılır ve sorun kaydedilir.
 * Geliştirme sırasında sorunlar konsola yazılır; testler ise tüm içeriği ayrıca denetler.
 */
function load(): ContentState {
  if (cache) return cache;
  const issues: ValidationIssue[] = [];

  const cur = validateCurriculum(rawCurriculum);
  const curriculum = cur.ok ? cur.value : null;
  if (!cur.ok) issues.push(...cur.issues);

  const lessons = new Map<string, LessonContent>();
  const comparisons = new Map<string, Comparison>();
  if (curriculum) {
    for (const [id, raw] of Object.entries(lessonFiles)) {
      const res = validateLessonContent(raw, curriculum);
      if (!res.ok) {
        issues.push(...res.issues);
        continue;
      }
      if (res.value.id !== id) {
        issues.push({ path: `lessonFiles.${id}`, message: `dosyadaki kimlik farklı: ${res.value.id}` });
        continue;
      }
      lessons.set(id, res.value);
    }
    for (const [id, raw] of Object.entries(comparisonFiles)) {
      const res = validateComparison(raw, curriculum);
      if (!res.ok) {
        issues.push(...res.issues);
        continue;
      }
      if (res.value.id !== id) {
        issues.push({ path: `comparisonFiles.${id}`, message: `dosyadaki kimlik farklı: ${res.value.id}` });
        continue;
      }
      comparisons.set(id, res.value);
    }
    const dup = findDuplicateQuestionIds([...lessons.values()], [...comparisons.values()]);
    issues.push(...dup);
  }

  if (issues.length > 0 && __DEV__) {
    console.error(`İçerik doğrulama sorunları:\n${formatIssues(issues)}`);
  }
  cache = { curriculum, lessons, comparisons, issues };
  return cache;
}

export function getCurriculum(): Curriculum | null {
  return load().curriculum;
}

export function getLessonContent(lessonId: string): LessonContent | null {
  return load().lessons.get(lessonId) ?? null;
}

export function getComparison(comparisonId: string): Comparison | null {
  return load().comparisons.get(comparisonId) ?? null;
}

/** İçeriği hazır olan müfredat kayıtları: dersler ve karşılaştırmalar. */
export function getAvailableLessonIds(): string[] {
  const state = load();
  return [...state.lessons.keys(), ...state.comparisons.keys()];
}

export function getAvailableComparisonIds(): string[] {
  return [...load().comparisons.keys()];
}

let questionIndex: Map<string, Question> | null = null;

/** Yüklenen tüm derslerdeki (alıştırma + sınav) soruları kimliğe göre getirir. */
export function getQuestionById(questionId: string): Question | undefined {
  if (!questionIndex) {
    questionIndex = new Map();
    for (const lesson of load().lessons.values()) {
      for (const q of [...lesson.exercises, ...lesson.exam.questions]) questionIndex.set(q.id, q);
    }
    for (const cmp of load().comparisons.values()) {
      for (const q of cmp.quiz) questionIndex.set(q.id, q);
    }
  }
  return questionIndex.get(questionId);
}

/** Bir dersin alıştırma ve sınav sorularının tümü; karşılaştırmada mini test soruları. */
export function getAllQuestionsForLesson(lessonId: string): Question[] {
  const state = load();
  const lesson = state.lessons.get(lessonId);
  if (lesson) return [...lesson.exercises, ...lesson.exam.questions];
  return state.comparisons.get(lessonId)?.quiz ?? [];
}

export function getContentIssues(): ValidationIssue[] {
  return load().issues;
}
