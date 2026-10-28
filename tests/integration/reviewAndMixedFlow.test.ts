import { getAllQuestionsForLesson, getLessonContent, getQuestionById } from "@/data/contentRepository";
import { buildMixedTest } from "@/domain/mixed/buildMixedTest";
import { getLessonStatus } from "@/domain/progress/lessonStatus";
import { computeAllMastery } from "@/features/progress/summary";
import { buildMistakeItems, unresolvedItems } from "@/features/mistakes/viewModel";
import { createProgressService } from "@/services/progress/progressService";
import { createUserStore } from "@/services/progress/userStore";
import { createUserStateRepository } from "@/services/storage/userStateRepository";

import { createMemoryStore } from "../fixtures/memoryStore";
import { correctResponse, wrongResponse } from "../fixtures/responses";

const LESSON = "a1-to-be";
const lesson = getLessonContent(LESSON)!;
const ctx = (mode: "practice" | "mistakes") => ({ sessionId: "s", mode });

function setup(memory = createMemoryStore()) {
  let t = 1_000;
  let n = 0;
  const store = createUserStore(createUserStateRepository({ store: memory, onError: () => {}, debounceMs: 0 }));
  const service = createProgressService({ store, now: () => (t += 10), newId: (p) => `${p}-${++n}` });
  return { memory, store, service };
}

const mastery = (store: ReturnType<typeof setup>["store"]) => computeAllMastery(store.getState(), [lesson])[LESSON];
const items = (store: ReturnType<typeof setup>["store"]) => buildMistakeItems(store.getState().mistakes, getQuestionById);

describe("yanlışlar: tekrar çözme akışı", () => {
  it("yanlış listeye girer, tekrar doğru çözülünce çözüldü olur ama kaydı silinmez", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const q = lesson.exercises[2];
    service.submitAnswer(q, wrongResponse(q), ctx("practice"));
    expect(unresolvedItems(items(store)).map((i) => i.question.id)).toEqual([q.id]);

    service.submitAnswer(q, correctResponse(q), ctx("mistakes"));
    expect(unresolvedItems(items(store))).toHaveLength(0);
    expect(items(store)).toHaveLength(1); // "Tümü" listesinde durur
    expect(items(store)[0].record).toMatchObject({ resolved: true, wrongCount: 1 });
    expect(store.getState().attempts.map((a) => a.mode)).toEqual(["practice", "mistakes"]);
  });

  it("listeden kaldırmak geçmiş sınav sonuçlarını ve cevap geçmişini silmez", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const exam = lesson.exam.questions;
    const result = service.submitExam({
      examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: exam, startedAt: 1, sessionId: "s",
      responses: Object.fromEntries(exam.map((q, i) => [q.id, i < 3 ? wrongResponse(q) : correctResponse(q)])),
    });
    expect(items(store)).toHaveLength(3);
    const before = store.getState();

    service.dismissMistake(exam[0].id);
    expect(items(store)).toHaveLength(2);
    expect(store.getState().examResults).toEqual(before.examResults);
    expect(store.getState().examResults[0]).toEqual(result);
    expect(store.getState().attempts).toEqual(before.attempts);
  });

  it("kaldırılan soru tekrar yanlış yapılırsa listeye geri döner", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const q = lesson.exercises[0];
    service.submitAnswer(q, wrongResponse(q), ctx("practice"));
    service.dismissMistake(q.id);
    expect(items(store)).toHaveLength(0);
    service.submitAnswer(q, wrongResponse(q), ctx("practice"));
    expect(items(store)[0].record).toMatchObject({ wrongCount: 2, dismissed: false });
  });
});

describe("tekrar listesi", () => {
  it("konu eklenir/çıkarılır, tekrar eklemek kopya oluşturmaz, yanlışlardan bağımsızdır", async () => {
    const memory = createMemoryStore();
    const { store, service } = setup(memory);
    await store.hydrate();
    const q = lesson.exercises[0];
    service.submitAnswer(q, wrongResponse(q), ctx("practice"));

    service.addToReviewList(LESSON);
    service.addToReviewList(LESSON);
    expect(store.getState().reviewList.map((r) => r.lessonId)).toEqual([LESSON]);
    expect(items(store)).toHaveLength(1);

    await store.flush();
    const reopened = setup(memory);
    await reopened.store.hydrate();
    expect(reopened.store.getState().reviewList).toHaveLength(1);

    reopened.service.removeFromReviewList(LESSON);
    expect(reopened.store.getState().reviewList).toEqual([]);
    expect(Object.keys(reopened.store.getState().mistakes)).toEqual([q.id]); // yanlışlar etkilenmez
  });
});

describe("karışık test", () => {
  it("sınav gibi çözülür; konu sınavı tamamlandı sayılmaz, cevaplar 'mixed' olarak işlenir", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const pool = getAllQuestionsForLesson(LESSON);
    const questions = buildMixedTest(pool, { questionTypes: ["fill_blank", "translation", "multiple_choice"], count: 12, seed: "t1" });
    expect(questions).toHaveLength(12);

    const responses = Object.fromEntries(questions.map((q, i) => [q.id, i % 4 === 0 ? wrongResponse(q) : i === 1 ? null : correctResponse(q)]));
    const result = service.submitExam({
      examId: "mixed-t1", lessonId: null, kind: "mixed", attemptMode: "mixed", questions, responses, startedAt: 1, sessionId: "s",
    });

    expect(result).toMatchObject({ kind: "mixed", lessonId: null, total: 12, skipped: 1, wrong: 3, correct: 8 });
    const s = store.getState();
    expect(s.attempts.every((a) => a.mode === "mixed")).toBe(true);
    expect(s.attempts).toHaveLength(11); // atlanan yazılmaz
    expect(s.lessonProgress[LESSON]?.examCompletedAt).toBeUndefined();
    expect(Object.keys(s.mistakes)).toHaveLength(3);
    expect(mastery(store).examTaken).toBe(false);
  });
});

describe("ustalık gerçek akıştan güncellenir", () => {
  it("alıştırma + sınav sonrası güçlü; yanlışlar artarsa düşer; durum etiketi uyar", async () => {
    const { store, service } = setup();
    await store.hydrate();
    service.openLesson(LESSON);
    service.markLessonRead(LESSON);
    expect(mastery(store)).toMatchObject({ band: "not_enough_data", score: 0 });

    for (const q of lesson.exercises) service.submitAnswer(q, correctResponse(q), ctx("practice"));
    service.finishPractice(LESSON, lesson.exercises.length, lesson.exercises.length);
    // Sınav çözülmedi: en çok "iyi"
    expect(mastery(store).band).toBe("good");
    expect(getLessonStatus(store.getState().lessonProgress[LESSON], mastery(store))).toBe("practice_done");

    const exam = lesson.exam.questions;
    service.submitExam({ examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: exam, startedAt: 1, sessionId: "s", responses: Object.fromEntries(exam.map((q) => [q.id, correctResponse(q)])) });
    expect(mastery(store)).toMatchObject({ band: "strong", score: 100, examTaken: true });
    expect(getLessonStatus(store.getState().lessonProgress[LESSON], mastery(store))).toBe("mastered");

    // Zayıf bir ikinci sınav ustalığı düşürür ve "tekrar gerekli" yapar.
    service.submitExam({ examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: exam, startedAt: 2, sessionId: "s2", responses: Object.fromEntries(exam.map((q) => [q.id, wrongResponse(q)])) });
    const after = mastery(store);
    expect(after.score).toBeLessThan(60);
    expect(getLessonStatus(store.getState().lessonProgress[LESSON], after)).toBe("review_needed");

    // Yanlışları tekrar doğru çözmek ustalığı yeniden yükseltir.
    for (const q of exam) service.submitAnswer(q, correctResponse(q), ctx("mistakes"));
    expect(mastery(store).score).toBeGreaterThan(after.score);
  });
});
