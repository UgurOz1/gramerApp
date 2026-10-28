import {
  QUESTION_TYPES,
  type AnswerAttempt,
  type ExamResult,
  type LessonProgress,
  type MistakeRecord,
  type ReviewItem,
  type UserPreferences,
  type UserState,
} from "@/domain/models";

export const CURRENT_USER_SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES: UserPreferences = {
  showHints: true,
  defaultMixedQuestionCount: 15,
};

export function createDefaultUserState(): UserState {
  return {
    schemaVersion: CURRENT_USER_SCHEMA_VERSION,
    lessonProgress: {},
    attempts: [],
    examResults: [],
    mistakes: {},
    reviewList: [],
    lastLessonId: null,
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const optNum = (v: unknown) => v === undefined || isNum(v);
const isQType = (v: unknown) => (QUESTION_TYPES as readonly unknown[]).includes(v);

function isAttempt(v: unknown): v is AnswerAttempt {
  return (
    isObj(v) &&
    isStr(v.attemptId) &&
    isStr(v.questionId) &&
    isStr(v.lessonId) &&
    isQType(v.questionType) &&
    typeof v.selectedAnswer === "string" &&
    typeof v.normalizedAnswer === "string" &&
    typeof v.isCorrect === "boolean" &&
    isNum(v.timestamp) &&
    isStr(v.sessionId) &&
    isStr(v.mode)
  );
}

function isLessonProgress(v: unknown): v is LessonProgress {
  return (
    isObj(v) &&
    isStr(v.lessonId) &&
    isNum(v.firstOpenedAt) &&
    isNum(v.lastOpenedAt) &&
    optNum(v.readAt) &&
    optNum(v.practiceCompletedAt) &&
    optNum(v.examCompletedAt)
  );
}

function isExamResult(v: unknown): v is ExamResult {
  return (
    isObj(v) &&
    isStr(v.resultId) &&
    isStr(v.examId) &&
    (v.lessonId === null || isStr(v.lessonId)) &&
    isStr(v.kind) &&
    [v.startedAt, v.finishedAt, v.total, v.correct, v.wrong, v.skipped, v.percent].every(isNum) &&
    Array.isArray(v.questionResults)
  );
}

function isMistake(v: unknown): v is MistakeRecord {
  return (
    isObj(v) &&
    isStr(v.questionId) &&
    isStr(v.lessonId) &&
    typeof v.lastWrongAnswer === "string" &&
    [v.wrongCount, v.firstWrongAt, v.lastWrongAt, v.lastAnsweredAt].every(isNum) &&
    typeof v.resolved === "boolean" &&
    typeof v.dismissed === "boolean"
  );
}

function isReviewItem(v: unknown): v is ReviewItem {
  return isObj(v) && isStr(v.lessonId) && isNum(v.addedAt);
}

function sanitizeRecord<T>(raw: unknown, guard: (v: unknown) => v is T, keyOf: (v: T) => string) {
  const out: Record<string, T> = {};
  let dropped = 0;
  if (isObj(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (guard(v) && keyOf(v) === k) out[k] = v;
      else dropped++;
    }
  } else if (raw !== undefined) dropped++;
  return { value: out, dropped };
}

function sanitizeArray<T>(raw: unknown, guard: (v: unknown) => v is T) {
  if (!Array.isArray(raw)) return { value: [] as T[], dropped: raw === undefined ? 0 : 1 };
  const value = raw.filter(guard);
  return { value, dropped: raw.length - value.length };
}

/**
 * Güncel şema sürümündeki ham veriyi onarır: geçersiz kayıtlar tek tek
 * atılır, geri kalan veri korunur. Bütün durumu çöpe atmaktan daha güvenlidir.
 */
export function sanitizeUserState(raw: Obj): { state: UserState; droppedCount: number } {
  const lp = sanitizeRecord(raw.lessonProgress, isLessonProgress, (v) => v.lessonId);
  const mistakes = sanitizeRecord(raw.mistakes, isMistake, (v) => v.questionId);
  const attempts = sanitizeArray(raw.attempts, isAttempt);
  const exams = sanitizeArray(raw.examResults, isExamResult);
  const review = sanitizeArray(raw.reviewList, isReviewItem);

  // Tekrar listesinde yinelenenleri ayıkla.
  const seen = new Set<string>();
  const reviewList = review.value.filter((r) => (seen.has(r.lessonId) ? false : (seen.add(r.lessonId), true)));

  const prefsRaw = isObj(raw.preferences) ? raw.preferences : {};
  const preferences: UserPreferences = {
    showHints: typeof prefsRaw.showHints === "boolean" ? prefsRaw.showHints : DEFAULT_PREFERENCES.showHints,
    defaultMixedQuestionCount:
      isNum(prefsRaw.defaultMixedQuestionCount) && prefsRaw.defaultMixedQuestionCount > 0
        ? Math.round(prefsRaw.defaultMixedQuestionCount)
        : DEFAULT_PREFERENCES.defaultMixedQuestionCount,
  };

  return {
    state: {
      schemaVersion: CURRENT_USER_SCHEMA_VERSION,
      lessonProgress: lp.value,
      attempts: attempts.value,
      examResults: exams.value,
      mistakes: mistakes.value,
      reviewList,
      lastLessonId: isStr(raw.lastLessonId) ? raw.lastLessonId : null,
      preferences,
    },
    droppedCount:
      lp.dropped + mistakes.dropped + attempts.dropped + exams.dropped + review.dropped +
      (review.value.length - reviewList.length),
  };
}
