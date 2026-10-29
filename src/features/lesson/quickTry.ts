import type { ExampleSentence, LessonContent, LessonSection } from "@/domain/models";

export type QuickTry = {
  /** Boşluklu cümle (vurgulanan kısım "___" ile değiştirilir). */
  sentence: string;
  /** Türkçe karşılığı: doğru seçeneği buradan bulunur. */
  tr: string;
  options: string[];
  correctIndex: number;
  /** Doğru kısmın cümledeki özgün yazımı (vurgulamak için). */
  correctText: string;
  /** Doğru cümlenin tamamı ve kuralın kalıbı (geri bildirimde gösterilir). */
  fullSentence: string;
  pattern: string;
  /** Kullanılan örneğin kimliği (aynı derste tekrar seçilmesin diye). */
  exampleId: string;
};

const wordCount = (t: string) => t.trim().split(/\s+/).length;

/** Cümle başı büyük harfi, "I" ve kısaltmalar dışında küçültür; seçenekler büyük harfle ipucu vermesin. */
const display = (t: string) => (/^(I|I['’])/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function candidates(section: LessonSection): { id: string; pattern: string }[] {
  if (section.type === "rule") return (section.formulas ?? []).flatMap((f) => (f.exampleIds ?? []).map((id) => ({ id, pattern: f.pattern })));
  if (section.type === "forms") return section.forms.flatMap((f) => f.exampleIds.map((id) => ({ id, pattern: f.formula })));
  return [];
}

/**
 * Bir kural bölümünden "hemen dene" sorusu üretir: kuralın kendi örneğindeki vurgulu kısım boşluk olur,
 * Türkçesi gösterilir, doğru İngilizce kalıp aynı dersin başka örneklerinden gelen seçenekler arasından seçilir.
 * Uygun örnek ya da yeterli seçenek yoksa null döner.
 */
export function buildQuickTry(lesson: LessonContent, section: LessonSection, usedIds: ReadonlySet<string> = new Set()): QuickTry | null {
  const byId = new Map<string, ExampleSentence>(lesson.examples.map((e) => [e.id, e]));
  const own = candidates(section);
  const pick = [...own].reverse().find(({ id }) => {
    const ex = byId.get(id);
    return !usedIds.has(id) && ex?.highlight && ex.en.includes(ex.highlight) && wordCount(ex.highlight) >= 2;
  });
  if (!pick) return null;
  const target = byId.get(pick.id)!;
  const correct = target.highlight!;

  const pool = lesson.examples
    .filter((e) => e.highlight && e.id !== target.id && e.highlight.toLowerCase() !== correct.toLowerCase())
    .map((e) => e.highlight!);
  const unique = [...new Map(pool.map((h) => [h.toLowerCase(), h])).values()];
  const tokens = (t: string) => t.toLowerCase().split(/\s+/);
  const tail = (t: string) => tokens(t).slice(1).join(" ");
  // Yalnızca ilk sözcüğü farklı seçenek (that / which gibi) doğru cevapla eş değer olabilir; elenir.
  const unambiguous = unique.filter((h) => tail(h) !== tail(correct));
  const overlap = (h: string) => tokens(h).filter((w) => tokens(correct).includes(w)).length;
  const score = (h: string) => Math.abs(wordCount(h) - wordCount(correct)) - overlap(h);
  const ranked = unambiguous
    .filter((h) => !own.some(({ id }) => byId.get(id)?.highlight === h))
    .sort((a, b) => score(a) - score(b) || hash(a + target.id) - hash(b + target.id));
  const distractors = ranked.slice(0, 3);
  if (distractors.length < 3) return null;

  const options = [correct, ...distractors];
  const correctIndex = hash(target.id) % 4;
  [options[0], options[correctIndex]] = [options[correctIndex], options[0]];

  return {
    sentence: target.en.replace(correct, "___"),
    tr: target.tr,
    options: options.map(display),
    correctIndex,
    correctText: correct,
    fullSentence: target.en,
    pattern: pick.pattern,
    exampleId: target.id,
  };
}
