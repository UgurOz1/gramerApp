export type Suggestion =
  | { kind: "mistakes"; title: string; description: string }
  | { kind: "review_lesson"; title: string; description: string; lessonId: string }
  | { kind: "continue_lesson"; title: string; description: string; lessonId: string }
  | { kind: "new_lesson"; title: string; description: string; lessonId: string }
  | { kind: "mixed"; title: string; description: string }
  | { kind: "none"; title: string; description: string };

type Input = {
  unresolvedMistakeCount: number;
  /** Ustalığı düşük (tekrar gerekli) dersler, önem sırasıyla. */
  reviewNeededLessonIds: string[];
  /** Kullanıcının kendi tekrar listesi. */
  reviewListLessonIds: string[];
  /** Açılmış ama tamamlanmamış dersler, en son açılan önce. */
  inProgressLessonIds: string[];
  /** Henüz başlanmamış, içeriği hazır dersler müfredat sırasıyla. */
  newLessonIds: string[];
  availableLessonCount: number;
  titleOf: (lessonId: string) => string;
};

export const MISTAKES_SUGGESTION_THRESHOLD = 3;

/**
 * Günün çalışma önerisi. Yalnızca yerel müfredata ve ilerlemeye dayanır;
 * kullanıcıyı seriye zorlamaz, yalnızca bir sonraki mantıklı adımı söyler.
 */
export function suggestToday(i: Input): Suggestion {
  if (i.unresolvedMistakeCount >= MISTAKES_SUGGESTION_THRESHOLD) {
    return {
      kind: "mistakes",
      title: "Yanlışlarını tekrar çöz",
      description: `${i.unresolvedMistakeCount} sorunun çözülmemiş. Açıklamalarla birlikte tekrar çözmek konuları pekiştirir.`,
    };
  }
  const review = i.reviewNeededLessonIds[0];
  if (review) {
    return { kind: "review_lesson", lessonId: review, title: `${i.titleOf(review)} konusunu tekrar et`, description: "Bu konudaki başarın düşük görünüyor. Dersi gözden geçirip alıştırmaları yeniden çözebilirsin." };
  }
  const listed = i.reviewListLessonIds[0];
  if (listed) {
    return { kind: "review_lesson", lessonId: listed, title: `${i.titleOf(listed)} konusunu tekrar et`, description: "Tekrar listene eklediğin bir konu." };
  }
  const inProgress = i.inProgressLessonIds[0];
  if (inProgress) {
    return { kind: "continue_lesson", lessonId: inProgress, title: `${i.titleOf(inProgress)} konusuna devam et`, description: "Başladığın bu konuyu bitirmek için dersi, alıştırmaları ve sınavı tamamla." };
  }
  const next = i.newLessonIds[0];
  if (next) {
    return { kind: "new_lesson", lessonId: next, title: `Yeni konu: ${i.titleOf(next)}`, description: "Müfredatta sıradaki konu. İstersen başka bir konuyu da açabilirsin." };
  }
  if (i.availableLessonCount > 0) {
    return { kind: "mixed", title: "Karışık test çöz", description: "Öğrendiğin konulardan karışık sorularla kendini dene." };
  }
  return { kind: "none", title: "Henüz hazır ders yok", description: "Yeni dersler eklendikçe burada öneriler göreceksin." };
}
