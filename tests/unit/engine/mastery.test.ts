import { MIN_ANSWERED_FOR_MASTERY } from "@/constants/mastery";
import { getLessonContent } from "@/data/contentRepository";
import type { AnswerAttempt, ExamResult, Question } from "@/domain/models";
import { getLessonStatus } from "@/domain/progress/lessonStatus";
import { bandForScore, computeTopicMastery } from "@/domain/scoring/mastery";

const lesson = getLessonContent("a1-to-be")!;
let t = 0;
const attempt = (q: Question, isCorrect: boolean, over: Partial<AnswerAttempt> = {}): AnswerAttempt => ({
  attemptId: `a${++t}`,
  questionId: q.id,
  lessonId: q.lessonId,
  questionType: q.type,
  selectedAnswer: "x",
  normalizedAnswer: "x",
  isCorrect,
  timestamp: 1000 + t,
  sessionId: "s",
  mode: "practice",
  ...over,
});
const exam = (percent: number, over: Partial<ExamResult> = {}): ExamResult => ({
  resultId: `r${++t}`,
  examId: lesson.exam.id,
  lessonId: lesson.id,
  kind: "lesson",
  startedAt: 1,
  finishedAt: 5000 + t,
  total: 20,
  correct: Math.round(percent / 5),
  wrong: 0,
  skipped: 0,
  percent,
  questionResults: [],
  ...over,
});
const compute = (attempts: AnswerAttempt[], examResults: ExamResult[]) =>
  computeTopicMastery({
    lessonId: lesson.id,
    exerciseQuestions: lesson.exercises,
    examQuestions: lesson.exam.questions,
    attempts,
    examResults,
  });

describe("bandForScore", () => {
  it.each([
    [0, "needs_work"], [39, "needs_work"], [40, "beginner"], [59, "beginner"],
    [60, "good"], [79, "good"], [80, "strong"], [100, "strong"],
  ])("%i → %s", (score, band) => expect(bandForScore(score)).toBe(band));
});

describe("computeTopicMastery", () => {
  it("hiç veri yokken puan 0 ve yeterli veri yok", () => {
    expect(compute([], [])).toMatchObject({ score: 0, band: "not_enough_data", answeredCount: 0, examTaken: false });
  });

  it("ağırlıklar: alıştırma %40 + sınav %40 + çeşitlilik %20", () => {
    // Tüm alıştırmalar doğru, sınav %100, sınav soruları da doğru → hepsi 100
    const all = [...lesson.exercises, ...lesson.exam.questions].map((q) => attempt(q, true));
    const m = compute(all, [exam(100)]);
    expect(m.components).toEqual({ practice: 100, exam: 100, variety: 100 });
    expect(m.score).toBe(100);
    expect(m.band).toBe("strong");
  });

  it("yalnızca alıştırma doğruysa puan sınav ve çeşitlilik eksikliği kadar düşer", () => {
    const ex = lesson.exercises.map((q) => attempt(q, true));
    const m = compute(ex, []);
    expect(m.components.practice).toBe(100);
    expect(m.components.exam).toBe(0);
    // çeşitlilik: sınav soruları çözülmediği için tür başına oran yine alıştırmalardan gelir → 100
    expect(m.score).toBe(60); // 0.4*1 + 0.4*0 + 0.2*1
  });

  it("yeterli soru çözülmediyse yüksek band iddia etmez", () => {
    const few = lesson.exercises.slice(0, MIN_ANSWERED_FOR_MASTERY - 1).map((q) => attempt(q, true));
    const m = compute(few, [exam(100)]);
    expect(m.answeredCount).toBe(MIN_ANSWERED_FOR_MASTERY - 1);
    expect(m.band).toBe("not_enough_data");
  });

  it("konu sınavı hiç çözülmediyse en yüksek band 'iyi' ile sınırlıdır", () => {
    const all = [...lesson.exercises, ...lesson.exam.questions].map((q) => attempt(q, true));
    const m = compute(all, []);
    expect(m.score).toBeGreaterThanOrEqual(60);
    expect(m.band).toBe("good");
    expect(compute(all, [exam(100)]).band).toBe("strong");
  });

  it("her soru için son cevap sayılır: yanlış sonra doğru çözülünce ustalık artar", () => {
    const qs = lesson.exercises.slice(0, 12);
    const wrongFirst = qs.map((q) => attempt(q, false));
    const low = compute(wrongFirst, [exam(50)]);
    const improved = compute([...wrongFirst, ...qs.map((q) => attempt(q, true))], [exam(50)]);
    expect(improved.score).toBeGreaterThan(low.score);
    expect(improved.components.practice).toBe(100);
    expect(low.components.practice).toBe(0);
  });

  it("konu sınavı için son deneme sayılır; karışık sınav konu sınavı yerine geçmez", () => {
    const base = lesson.exercises.map((q) => attempt(q, true));
    const older = exam(40, { finishedAt: 100 });
    const newer = exam(90, { finishedAt: 200 });
    expect(compute(base, [older, newer]).components.exam).toBe(90);
    expect(compute(base, [exam(100, { kind: "mixed", lessonId: null })]).examTaken).toBe(false);
  });

  it("başka dersin cevapları etkilemez", () => {
    const other = lesson.exercises.map((q) => attempt(q, true, { lessonId: "a1-present-simple" }));
    expect(compute(other, [])).toMatchObject({ answeredCount: 0, score: 0 });
  });

  it("çeşitlilik: bir soru türünü hiç çözmemek puanı düşürür", () => {
    const noTranslation = lesson.exercises.filter((q) => q.type !== "translation").map((q) => attempt(q, true));
    const all = lesson.exercises.map((q) => attempt(q, true));
    expect(compute(noTranslation, []).components.variety).toBeLessThan(compute(all, []).components.variety);
  });
});

describe("getLessonStatus + ustalık", () => {
  const progress = { lessonId: "x", firstOpenedAt: 1, lastOpenedAt: 1, readAt: 2, practiceCompletedAt: 3 };
  const mastery = (band: any, score: number) => ({ lessonId: "x", band, score, answeredCount: 20, examTaken: true, components: { practice: 0, exam: 0, variety: 0 } });

  it("ustalık güçlüyse 'ustalık kazanıldı'", () => {
    expect(getLessonStatus({ ...progress, examCompletedAt: 4 }, mastery("strong", 90))).toBe("mastered");
  });
  it("alıştırmalar bitmiş ama ustalık düşükse 'tekrar gerekli'", () => {
    expect(getLessonStatus({ ...progress, examCompletedAt: 4 }, mastery("beginner", 45))).toBe("review_needed");
  });
  it("yeterli veri yoksa ustalık durumu etkilemez", () => {
    expect(getLessonStatus({ ...progress, examCompletedAt: 4 }, mastery("not_enough_data", 0))).toBe("exam_done");
    expect(getLessonStatus(progress)).toBe("practice_done");
    expect(getLessonStatus(undefined)).toBe("not_started");
  });
});
