import type { Question, QuestionType } from "@/domain/models";
import { seededShuffle } from "@/domain/question-engine/shuffle";

export type MixedTestOptions = {
  questionTypes: QuestionType[];
  count: number;
  /** Aynı tohum aynı testi üretir (rota parametresiyle yeniden kurulabilsin diye). */
  seed: string;
};

/**
 * Havuzdaki sorulardan karışık test kurar:
 *  - yalnızca seçilen soru türleri,
 *  - konulara dengeli dağılım (sırayla her konudan bir soru),
 *  - son sıra karışık, böylece aynı konunun soruları ardışık gelmez.
 */
export function buildMixedTest(pool: Question[], options: MixedTestOptions): Question[] {
  const allowed = new Set(options.questionTypes);
  const filtered = pool.filter((q) => allowed.has(q.type));

  const byLesson = new Map<string, Question[]>();
  for (const q of seededShuffle(filtered, `${options.seed}:pool`)) {
    const list = byLesson.get(q.lessonId) ?? [];
    list.push(q);
    byLesson.set(q.lessonId, list);
  }

  const queues = seededShuffle([...byLesson.values()], `${options.seed}:lessons`);
  const picked: Question[] = [];
  while (picked.length < options.count && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) picked.push(next);
      if (picked.length >= options.count) break;
    }
  }
  return seededShuffle(picked, `${options.seed}:order`);
}

/** Verilen filtreyle test için kaç soru bulunduğunu söyler. */
export function countAvailableQuestions(pool: Question[], questionTypes: QuestionType[]): number {
  const allowed = new Set(questionTypes);
  return pool.filter((q) => allowed.has(q.type)).length;
}
