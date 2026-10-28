import { breakdownByType, scoreExam } from "@/domain/scoring/examScoring";
import { makeValidLesson } from "../../fixtures/lesson";
import { correctResponse, wrongResponse } from "../../fixtures/responses";

const lesson = makeValidLesson();
const questions = [...lesson.exercises, ...lesson.exam.questions]; // 3 + 2 = 5 soru

const score = (responses: Parameters<typeof scoreExam>[0]["responses"]) =>
  scoreExam({
    resultId: "r1",
    examId: "exam-a1-to-be",
    lessonId: "a1-to-be",
    kind: "lesson",
    questions,
    responses,
    startedAt: 1,
    finishedAt: 2,
  });

describe("scoreExam", () => {
  it("doğru, yanlış ve atlananları ayrı sayar", () => {
    const { result } = score({
      [questions[0].id]: correctResponse(questions[0]),
      [questions[1].id]: correctResponse(questions[1]),
      [questions[2].id]: wrongResponse(questions[2]),
      [questions[3].id]: null, // atlandı
      // questions[4]: hiç cevaplanmadı → atlandı
    });
    expect(result).toMatchObject({ total: 5, correct: 2, wrong: 1, skipped: 2, percent: 40 });
  });

  it("başarı yüzdesini toplam soru üzerinden hesaplar", () => {
    const all = Object.fromEntries(questions.map((q) => [q.id, correctResponse(q)]));
    expect(score(all).result.percent).toBe(100);
    expect(score({}).result).toMatchObject({ percent: 0, skipped: 5, correct: 0, wrong: 0 });
  });

  it("atlanan soru için değerlendirme üretmez, soru sonuçlarında null işaretler", () => {
    const { result, evaluations } = score({ [questions[0].id]: correctResponse(questions[0]) });
    expect(Object.keys(evaluations)).toEqual([questions[0].id]);
    expect(result.questionResults.find((r) => r.questionId === questions[1].id)).toMatchObject({ isCorrect: null, answer: null });
  });

  it("boş metin cevabını atlanmış sayar", () => {
    const fillQ = questions.find((q) => q.type === "fill_blank")!;
    expect(score({ [fillQ.id]: { type: "fill_blank", text: "  " } }).result.skipped).toBe(5);
  });

  it("soru türüne göre kırılım verir", () => {
    const { result } = score({
      [questions[0].id]: correctResponse(questions[0]),
      [questions[1].id]: wrongResponse(questions[1]),
    });
    const b = breakdownByType(result.questionResults);
    expect(b.multiple_choice).toEqual({ correct: 1, total: 1 });
    expect(b.fill_blank).toEqual({ correct: 0, total: 1 });
    expect(b.translation).toEqual({ correct: 0, total: 1 });
  });
});
