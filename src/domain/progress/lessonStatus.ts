import type { LessonProgress } from "@/domain/models";

/**
 * Ders durumu (ustalıktan bağımsızdır). "Tekrar gerekli" ve "Ustalık kazanıldı"
 * durumları ustalık hesabı geldiğinde (Aşama 4) eklenecek.
 */
export type LessonStatus = "not_started" | "learning" | "practice_done" | "exam_done";

export function getLessonStatus(progress: LessonProgress | undefined): LessonStatus {
  if (!progress) return "not_started";
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
};
