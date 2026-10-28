import type { MistakeRecord, Question } from "@/domain/models";

export type MistakeItem = {
  record: MistakeRecord;
  question: Question;
};

/**
 * Yanlışlar defterini ekranda gösterilecek listeye çevirir.
 * Listeden kaldırılanlar ve içeriği bulunamayanlar (ör. sonradan silinen soru) gösterilmez.
 * Sıralama: çözülmemişler önce; sonra daha çok yanlış yapılan; sonra en son yanlış.
 */
export function buildMistakeItems(
  mistakes: Record<string, MistakeRecord>,
  getQuestion: (id: string) => Question | undefined,
): MistakeItem[] {
  const items: MistakeItem[] = [];
  for (const record of Object.values(mistakes)) {
    if (record.dismissed) continue;
    const question = getQuestion(record.questionId);
    if (question) items.push({ record, question });
  }
  return items.sort(
    (a, b) =>
      Number(a.record.resolved) - Number(b.record.resolved) ||
      b.record.wrongCount - a.record.wrongCount ||
      b.record.lastWrongAt - a.record.lastWrongAt,
  );
}

export function unresolvedItems(items: MistakeItem[]): MistakeItem[] {
  return items.filter((i) => !i.record.resolved);
}

/** Çözülmemiş yanlışları konuya göre toplar; en çok hata yapılan konu önce gelir. */
export function topMistakeLessons(items: MistakeItem[], limit = 3): { lessonId: string; count: number; wrongTotal: number }[] {
  const map = new Map<string, { lessonId: string; count: number; wrongTotal: number }>();
  for (const { record } of unresolvedItems(items)) {
    const e = map.get(record.lessonId) ?? { lessonId: record.lessonId, count: 0, wrongTotal: 0 };
    e.count++;
    e.wrongTotal += record.wrongCount;
    map.set(record.lessonId, e);
  }
  return [...map.values()].sort((a, b) => b.wrongTotal - a.wrongTotal || b.count - a.count).slice(0, limit);
}
