import type { QuestionType } from "./question";

export type AnswerMode = "lesson_check" | "practice" | "exam" | "mistakes" | "mixed" | "comparison";

/** Tek bir soru cevabı. Aralıklı tekrar gibi gelecekteki özellikler için tam geçmiş tutulur. */
export type AnswerAttempt = {
  attemptId: string;
  questionId: string;
  lessonId: string;
  questionType: QuestionType;
  /** Kullanıcının verdiği ham cevap (seçenek kimliği, metin veya birleştirilmiş parçalar). */
  selectedAnswer: string;
  normalizedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  sessionId: string;
  mode: AnswerMode;
};

/** Ders tamamlama durumu. Ustalıktan ayrı tutulur. */
export type LessonProgress = {
  lessonId: string;
  firstOpenedAt: number;
  lastOpenedAt: number;
  /** Ders anlatımının sonuna kadar okunduğu an. */
  readAt?: number;
  /** Alıştırma setinin bitirildiği an. */
  practiceCompletedAt?: number;
  /** Konu sonu sınavının en az bir kez bitirildiği an. */
  examCompletedAt?: number;
};

export type ExamQuestionResult = {
  questionId: string;
  lessonId: string;
  questionType: QuestionType;
  /** null: atlandı. */
  isCorrect: boolean | null;
  answer: string | null;
};

/** Her sınav denemesi ayrı bir kayıttır; sonradan değiştirilmez. */
export type ExamResult = {
  resultId: string;
  examId: string;
  /** Konu sonu sınavında dersin kimliği; karışık sınavda null. */
  lessonId: string | null;
  kind: "lesson" | "unit" | "mixed" | "comparison";
  startedAt: number;
  finishedAt: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percent: number;
  questionResults: ExamQuestionResult[];
};

/** Soru kimliğine göre tekil yanlış kaydı. */
export type MistakeRecord = {
  questionId: string;
  lessonId: string;
  lastWrongAnswer: string;
  wrongCount: number;
  firstWrongAt: number;
  lastWrongAt: number;
  lastAnsweredAt: number;
  /** Son cevap doğruysa true; kayıt silinmez, yalnızca "çözüldü" görünür. */
  resolved: boolean;
  /** Kullanıcı listeden kaldırdıysa true. Tekrar yanlış yaparsa yeniden görünür. */
  dismissed: boolean;
};

export type ReviewItem = {
  lessonId: string;
  addedAt: number;
};

export type UserPreferences = {
  showHints: boolean;
  /** Karışık testlerde varsayılan soru sayısı. */
  defaultMixedQuestionCount: number;
};

export type UserState = {
  schemaVersion: number;
  lessonProgress: Record<string, LessonProgress>;
  attempts: AnswerAttempt[];
  examResults: ExamResult[];
  mistakes: Record<string, MistakeRecord>;
  reviewList: ReviewItem[];
  lastLessonId: string | null;
  preferences: UserPreferences;
};

export type MasteryBand = "not_enough_data" | "needs_work" | "beginner" | "good" | "strong";

/** Hesaplanan değer; saklanmaz, cevap geçmişinden türetilir. */
export type TopicMastery = {
  lessonId: string;
  /** 0–100 */
  score: number;
  band: MasteryBand;
  answeredCount: number;
};
