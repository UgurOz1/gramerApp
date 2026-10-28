import rawCurriculum from "@/assets/data/curriculum.json";
import type { Curriculum, LessonContent, Question } from "@/domain/models";
import type { ValidationIssue } from "@/domain/validation/result";
import {
  findDuplicateQuestionIds,
  formatIssues,
  validateCurriculum,
  validateLessonContent,
} from "@/domain/validation/validateContent";

import { lessonFiles } from "./lessonFiles";

type ContentState = {
  curriculum: Curriculum | null;
  lessons: Map<string, LessonContent>;
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
    const dup = findDuplicateQuestionIds([...lessons.values()], null);
    issues.push(...dup);
  }

  if (issues.length > 0 && __DEV__) {
    console.error(`İçerik doğrulama sorunları:\n${formatIssues(issues)}`);
  }
  cache = { curriculum, lessons, issues };
  return cache;
}

export function getCurriculum(): Curriculum | null {
  return load().curriculum;
}

export function getLessonContent(lessonId: string): LessonContent | null {
  return load().lessons.get(lessonId) ?? null;
}

export function getAvailableLessonIds(): string[] {
  return [...load().lessons.keys()];
}

let questionIndex: Map<string, Question> | null = null;

/** Yüklenen tüm derslerdeki (alıştırma + sınav) soruları kimliğe göre getirir. */
export function getQuestionById(questionId: string): Question | undefined {
  if (!questionIndex) {
    questionIndex = new Map();
    for (const lesson of load().lessons.values()) {
      for (const q of [...lesson.exercises, ...lesson.exam.questions]) questionIndex.set(q.id, q);
    }
  }
  return questionIndex.get(questionId);
}

/** Bir dersin alıştırma ve sınav sorularının tümü. */
export function getAllQuestionsForLesson(lessonId: string): Question[] {
  const lesson = load().lessons.get(lessonId);
  return lesson ? [...lesson.exercises, ...lesson.exam.questions] : [];
}

export function getContentIssues(): ValidationIssue[] {
  return load().issues;
}
