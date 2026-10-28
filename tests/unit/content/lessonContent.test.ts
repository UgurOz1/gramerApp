import { getLessonContent } from "@/data/contentRepository";
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

describeLesson("a1-to-be", { examples: 24, exercises: 36, exam: 20 });
