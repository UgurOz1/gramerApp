import { computeTopicMastery } from "@/domain/scoring/mastery";
import type { LessonContent, LessonSummary, TopicMastery, UserState } from "@/domain/models";
import { isLessonCompleted } from "@/domain/progress/lessonStatus";

/** Yüklenmiş (içeriği hazır) her ders için ustalığı cevap geçmişinden hesaplar. */
export function computeAllMastery(
  state: Pick<UserState, "attempts" | "examResults">,
  lessons: Iterable<LessonContent>,
): Record<string, TopicMastery> {
  const out: Record<string, TopicMastery> = {};
  for (const lesson of lessons) {
    out[lesson.id] = computeTopicMastery({
      lessonId: lesson.id,
      exerciseQuestions: lesson.exercises,
      examQuestions: lesson.exam.questions,
      attempts: state.attempts,
      examResults: state.examResults,
    });
  }
  return out;
}

/**
 * Bir dersin ilerleme değeri (0–1): yarısı ders tamamlama, yarısı ustalık.
 * İçeriği henüz hazır olmayan dersler 0 sayılır; bu yüzden seviye ilerlemesi
 * gerçekte olduğundan yüksek görünmez. Tüm konularda %100 gerekmez.
 */
export function lessonProgressValue(
  progress: UserState["lessonProgress"][string] | undefined,
  mastery: TopicMastery | undefined,
): number {
  const completion = isLessonCompleted(progress) ? 0.5 : 0;
  const masteryPart = mastery && mastery.band !== "not_enough_data" ? 0.5 * (mastery.score / 100) : 0;
  return completion + masteryPart;
}

export function levelProgress(
  lessons: LessonSummary[],
  state: Pick<UserState, "lessonProgress">,
  mastery: Record<string, TopicMastery>,
): { value: number; completed: number; total: number; available: number } {
  const total = lessons.length;
  if (total === 0) return { value: 0, completed: 0, total: 0, available: 0 };
  let sum = 0;
  let completed = 0;
  let available = 0;
  for (const l of lessons) {
    const progress = state.lessonProgress[l.id];
    sum += lessonProgressValue(progress, mastery[l.id]);
    if (isLessonCompleted(progress)) completed++;
    if (mastery[l.id]) available++;
  }
  return { value: sum / total, completed, total, available };
}

export function quickStats(state: Pick<UserState, "attempts" | "lessonProgress">) {
  const answered = state.attempts.length;
  const correct = state.attempts.filter((a) => a.isCorrect).length;
  const completedLessons = Object.values(state.lessonProgress).filter((p) => isLessonCompleted(p)).length;
  return { answered, correct, accuracy: answered ? correct / answered : null, completedLessons };
}
