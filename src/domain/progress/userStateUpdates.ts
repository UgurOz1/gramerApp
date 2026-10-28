import type {
  AnswerAttempt,
  ExamResult,
  MistakeRecord,
  UserState,
} from "@/domain/models";

/** Cevap geçmişinde tutulacak en fazla kayıt; en eskiler silinir. */
export const MAX_ATTEMPTS = 3000;
/** Saklanacak en fazla sınav sonucu. */
export const MAX_EXAM_RESULTS = 300;

/**
 * Bir cevabı geçmişe ekler ve yanlışlar defterini günceller.
 * Atlanan sorular bu fonksiyona gönderilmez (yanlış sayılmaz).
 */
export function recordAnswer(state: UserState, attempt: AnswerAttempt): UserState {
  const attempts = [...state.attempts, attempt];
  if (attempts.length > MAX_ATTEMPTS) attempts.splice(0, attempts.length - MAX_ATTEMPTS);
  return { ...state, attempts, mistakes: updateMistakes(state.mistakes, attempt) };
}

function updateMistakes(mistakes: Record<string, MistakeRecord>, a: AnswerAttempt): Record<string, MistakeRecord> {
  const existing = mistakes[a.questionId];
  if (a.isCorrect) {
    if (!existing) return mistakes;
    // Kayıt silinmez; yalnızca çözüldü olarak işaretlenir.
    return { ...mistakes, [a.questionId]: { ...existing, resolved: true, lastAnsweredAt: a.timestamp } };
  }
  const record: MistakeRecord = existing
    ? {
        ...existing,
        lastWrongAnswer: a.selectedAnswer,
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: a.timestamp,
        lastAnsweredAt: a.timestamp,
        resolved: false,
        dismissed: false,
      }
    : {
        questionId: a.questionId,
        lessonId: a.lessonId,
        lastWrongAnswer: a.selectedAnswer,
        wrongCount: 1,
        firstWrongAt: a.timestamp,
        lastWrongAt: a.timestamp,
        lastAnsweredAt: a.timestamp,
        resolved: false,
        dismissed: false,
      };
  return { ...mistakes, [a.questionId]: record };
}

/** Yanlışı listeden kaldırır. Cevap geçmişi ve sınav sonuçları etkilenmez. */
export function dismissMistake(state: UserState, questionId: string): UserState {
  const existing = state.mistakes[questionId];
  if (!existing || existing.dismissed) return state;
  return { ...state, mistakes: { ...state.mistakes, [questionId]: { ...existing, dismissed: true } } };
}

export function addToReviewList(state: UserState, lessonId: string, now: number): UserState {
  if (state.reviewList.some((r) => r.lessonId === lessonId)) return state;
  return { ...state, reviewList: [...state.reviewList, { lessonId, addedAt: now }] };
}

export function removeFromReviewList(state: UserState, lessonId: string): UserState {
  if (!state.reviewList.some((r) => r.lessonId === lessonId)) return state;
  return { ...state, reviewList: state.reviewList.filter((r) => r.lessonId !== lessonId) };
}

export function markLessonOpened(state: UserState, lessonId: string, now: number): UserState {
  const prev = state.lessonProgress[lessonId];
  return {
    ...state,
    lastLessonId: lessonId,
    lessonProgress: {
      ...state.lessonProgress,
      [lessonId]: prev ? { ...prev, lastOpenedAt: now } : { lessonId, firstOpenedAt: now, lastOpenedAt: now },
    },
  };
}

type CompletionField = "readAt" | "practiceCompletedAt" | "examCompletedAt";

/** İlk tamamlama zamanını korur; tekrar tamamlamak tarihi değiştirmez. */
export function markLessonStep(state: UserState, lessonId: string, field: CompletionField, now: number): UserState {
  const prev = state.lessonProgress[lessonId] ?? { lessonId, firstOpenedAt: now, lastOpenedAt: now };
  if (prev[field] !== undefined) return state;
  return { ...state, lessonProgress: { ...state.lessonProgress, [lessonId]: { ...prev, [field]: now } } };
}

/** Her sınav denemesi yeni bir kayıt olarak eklenir. */
export function recordExamResult(state: UserState, result: ExamResult): UserState {
  const examResults = [...state.examResults, result];
  if (examResults.length > MAX_EXAM_RESULTS) examResults.splice(0, examResults.length - MAX_EXAM_RESULTS);
  const next = { ...state, examResults };
  return result.lessonId && result.kind === "lesson"
    ? markLessonStep(next, result.lessonId, "examCompletedAt", result.finishedAt)
    : next;
}
