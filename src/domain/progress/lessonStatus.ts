import { REVIEW_NEEDED_BELOW } from "@/constants/mastery";
import type { LessonProgress, TopicMastery } from "@/domain/models";

/**
 * Ders durumu. Tamamlama adımları (okundu, alıştırma, sınav) ile ustalık ayrı
 * kavramlardır; durum bunları birlikte özetler.
 */
export type LessonStatus =
  | "not_started"
  | "learning"
  | "practice_done"
  | "exam_done"
  | "review_needed"
  | "mastered";

export function getLessonStatus(progress: LessonProgress | undefined, mastery?: TopicMastery): LessonStatus {
  if (!progress) return "not_started";
  const enoughData = !!mastery && mastery.band !== "not_enough_data";
  if (enoughData && mastery.band === "strong") return "mastered";
  if (enoughData && mastery.score < REVIEW_NEEDED_BELOW && progress.practiceCompletedAt !== undefined) return "review_needed";
  if (progress.examCompletedAt !== undefined) return "exam_done";
  if (progress.practiceCompletedAt !== undefined) return "practice_done";
  return "learning";
}

/** Ders tamamlandı: ders okundu ve alıştırmalar bitirildi. */
export function isLessonCompleted(progress: LessonProgress | undefined): boolean {
  return !!progress && progress.readAt !== undefined && progress.practiceCompletedAt !== undefined;
}

export const lessonStatusLabels: Record<LessonStatus, string> = {
  not_started: "Başlanmadı",
  learning: "Öğreniliyor",
  practice_done: "Alıştırmalar tamamlandı",
  exam_done: "Sınav tamamlandı",
  review_needed: "Tekrar gerekli",
  mastered: "Ustalık kazanıldı",
};
