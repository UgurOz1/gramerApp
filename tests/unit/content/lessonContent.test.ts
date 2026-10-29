import { getComparison, getLessonContent } from "@/data/contentRepository";
import type { LessonContent, Question } from "@/domain/models";
import { evaluateAnswer } from "@/domain/question-engine/evaluate";
import { normalizeAnswer } from "@/domain/question-engine/normalize";

import { correctResponse, wrongResponse } from "../../fixtures/responses";

/** Ders içeriğinin kendi içinde tutarlı ve kalite eşiklerini karşıladığını denetler. */
function describeLesson(lessonId: string, minimums: { examples: number; exercises: number; exam: number }) {
  describe(`${lessonId} içeriği`, () => {
    const lesson = getLessonContent(lessonId) as LessonContent;
    const all: Question[] = lesson ? [...lesson.exercises, ...lesson.exam.questions] : [];

    it("yüklenir", () => expect(lesson).not.toBeNull());

    it("yeterli örnek, alıştırma ve sınav sorusu içerir", () => {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(minimums.examples);
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(minimums.exercises);
      expect(lesson.exam.questions.length).toBeGreaterThanOrEqual(minimums.exam);
    });

    it("beş zorunlu soru türünün hepsini hem alıştırmada hem sınavda kullanır", () => {
      const types = ["multiple_choice", "fill_blank", "sentence_building", "error_correction", "translation"];
      for (const t of types) {
        expect(lesson.exercises.some((q) => q.type === t)).toBe(true);
        expect(lesson.exam.questions.some((q) => q.type === t)).toBe(true);
      }
    });

    it("her sorunun birincil doğru cevabı doğru değerlendirilir", () => {
      for (const q of all) expect({ id: q.id, ok: evaluateAnswer(q, correctResponse(q)).isCorrect }).toEqual({ id: q.id, ok: true });
    });

    it("kabul edilen her alternatif doğru değerlendirilir", () => {
      for (const q of all) {
        if (q.type === "fill_blank" || q.type === "error_correction" || q.type === "translation") {
          for (const a of q.answers) {
            expect(evaluateAnswer(q, { type: q.type, text: a }).isCorrect).toBe(true);
          }
        }
      }
    });

    it("açıkça yanlış verilen geri bildirim cevapları yanlış değerlendirilir", () => {
      for (const q of all) {
        if (q.type === "fill_blank" || q.type === "error_correction" || q.type === "translation") {
          for (const f of q.wrongAnswerFeedback ?? []) {
            const e = evaluateAnswer(q, { type: q.type, text: f.answer });
            expect({ id: q.id, answer: f.answer, ok: e.isCorrect }).toEqual({ id: q.id, answer: f.answer, ok: false });
            expect(e.feedback).toBe(f.explanation);
          }
        }
      }
    });

    it("kesin yanlış cevap hiçbir soruda doğru sayılmaz", () => {
      for (const q of all) expect(evaluateAnswer(q, wrongResponse(q)).isCorrect).toBe(false);
    });

    it("çoktan seçmelide her yanlış seçenek için açıklama vardır", () => {
      for (const q of all) {
        if (q.type !== "multiple_choice") continue;
        for (const o of q.options.filter((x) => x.id !== q.correctOptionId)) {
          expect(q.optionExplanations[o.id]).toBeTruthy();
        }
      }
    });

    it("alıştırma ve sınavda aynı soru metni tekrar etmez", () => {
      const keyOf = (q: Question) =>
        normalizeAnswer(
          q.type === "translation" ? q.source : q.type === "error_correction" ? q.incorrectSentence : q.type === "sentence_building" ? q.answer.join(" ") : q.prompt,
        ) + (q.type === "multiple_choice" ? `|${normalizeAnswer(q.options.map((o) => o.text).join(","))}` : "");
      const keys = all.map(keyOf);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("tüm örneklerin Türkçe karşılığı vardır ve örnek kimlikleri benzersizdir", () => {
      expect(new Set(lesson.examples.map((e) => e.id)).size).toBe(lesson.examples.length);
      for (const e of lesson.examples) expect(e.tr.length).toBeGreaterThan(2);
    });
  });
}

describeLesson("a1-pronouns-sentence", { examples: 24, exercises: 36, exam: 16 });
describeLesson("a1-have-got", { examples: 28, exercises: 40, exam: 18 });
describeLesson("a1-articles", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-plurals", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-demonstratives", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-possessives", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-there-is-are", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-countable-some-any", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-adverbs-frequency", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-wh-questions", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-can", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-imperatives", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-prepositions-place", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-prepositions-time", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-object-pronouns", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-conjunctions", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-comparatives-basic", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-past-be", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-past-continuous", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-will", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-going-to", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-present-continuous-future", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-present-perfect", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-ever-never-just-already-yet", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-for-since", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-quantifiers", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-too-enough", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-comparatives-superlatives", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-as-as", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-adjectives-adverbs", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-must-have-to", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-should", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-zero-conditional", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-first-conditional", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-gerund-infinitive-intro", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-relative-clauses-intro", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-indefinite-pronouns", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-question-tags-intro", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-so-because", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-passive-basic", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a2-reported-speech-basic", { examples: 28, exercises: 40, exam: 16 });
describeLesson("a1-to-be", { examples: 24, exercises: 36, exam: 20 });
describeLesson("a1-present-simple", { examples: 30, exercises: 40, exam: 20 });
describeLesson("a1-present-continuous", { examples: 30, exercises: 40, exam: 20 });
describeLesson("a2-past-simple", { examples: 30, exercises: 40, exam: 20 });

/** Karşılaştırma içeriği: yapı, örnek çiftleri ve mini testin tutarlılığı. */
function describeComparison(comparisonId: string, minimums: { pairs: number; quiz: number }) {
  describe(`${comparisonId} karşılaştırması`, () => {
    const cmp = getComparison(comparisonId)!;
    const quiz = cmp ? cmp.quiz : [];

    it("yüklenir ve yeterli yan yana örnek ile mini test sorusu içerir", () => {
      expect(cmp).not.toBeNull();
      expect(cmp.pairs.length).toBeGreaterThanOrEqual(minimums.pairs);
      expect(quiz.length).toBeGreaterThanOrEqual(minimums.quiz);
    });

    it("her yapı için olumlu, olumsuz ve soru biçimi ile ipucu sözcük verir", () => {
      for (const st of cmp.structures) {
        const labels = st.forms.map((f) => f.label);
        expect(labels).toEqual(expect.arrayContaining(["Olumlu", "Olumsuz", "Soru"]));
        expect(st.signals.length).toBeGreaterThan(2);
      }
    });

    it("mini test beş soru türünün hepsini kullanır", () => {
      for (const t of ["multiple_choice", "fill_blank", "sentence_building", "error_correction", "translation"]) {
        expect(quiz.some((q) => q.type === t)).toBe(true);
      }
    });

    it("her sorunun doğru cevabı ve tanımlı alternatifleri doğru değerlendirilir", () => {
      for (const q of quiz) {
        expect({ id: q.id, ok: evaluateAnswer(q, correctResponse(q)).isCorrect }).toEqual({ id: q.id, ok: true });
        if (q.type === "fill_blank" || q.type === "error_correction" || q.type === "translation") {
          for (const a of q.answers) expect(evaluateAnswer(q, { type: q.type, text: a }).isCorrect).toBe(true);
          for (const f of q.wrongAnswerFeedback ?? []) {
            const e = evaluateAnswer(q, { type: q.type, text: f.answer });
            expect({ id: q.id, answer: f.answer, ok: e.isCorrect }).toEqual({ id: q.id, answer: f.answer, ok: false });
          }
        }
      }
    });

    it("kesin yanlış cevap hiçbir soruda doğru sayılmaz ve yanlış seçeneklerin açıklaması vardır", () => {
      for (const q of quiz) {
        expect(evaluateAnswer(q, wrongResponse(q)).isCorrect).toBe(false);
        if (q.type === "multiple_choice") {
          for (const o of q.options.filter((x) => x.id !== q.correctOptionId)) expect(q.optionExplanations[o.id]).toBeTruthy();
        }
      }
    });

    it("örnek cümlelerin Türkçe karşılığı vardır", () => {
      for (const p of cmp.pairs) {
        expect(p.left.tr.length).toBeGreaterThan(2);
        expect(p.right.tr.length).toBeGreaterThan(2);
      }
    });
  });
}

describeComparison("a1-present-simple-vs-continuous", { pairs: 10, quiz: 24 });
describeComparison("a2-present-perfect-vs-past-simple", { pairs: 10, quiz: 24 });
describeComparison("a2-past-simple-vs-continuous", { pairs: 10, quiz: 24 });
describeComparison("a2-will-vs-going-to", { pairs: 10, quiz: 24 });
describeComparison("b1-first-vs-second-conditional", { pairs: 10, quiz: 24 });
