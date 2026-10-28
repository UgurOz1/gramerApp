import { getLessonContent } from "@/data/contentRepository";
import { getLessonStatus, isLessonCompleted } from "@/domain/progress/lessonStatus";
import { createProgressService } from "@/services/progress/progressService";
import { createUserStore } from "@/services/progress/userStore";
import { createUserStateRepository } from "@/services/storage/userStateRepository";

import { createMemoryStore } from "../fixtures/memoryStore";
import { correctResponse, wrongResponse } from "../fixtures/responses";

const LESSON = "a1-to-be";

function setup(memory = createMemoryStore()) {
  let t = 1_000;
  let n = 0;
  const store = createUserStore(createUserStateRepository({ store: memory, onError: () => {}, debounceMs: 0 }));
  const service = createProgressService({ store, now: () => (t += 10), newId: (p) => `${p}-${++n}` });
  return { memory, store, service };
}

const lesson = getLessonContent(LESSON)!;

describe("öğrenme akışı: ders → alıştırma → sınav", () => {
  it("dersi açmak ilerleme kaydı oluşturur ve son dersi günceller", async () => {
    const { store, service } = setup();
    await store.hydrate();
    expect(getLessonStatus(store.getState().lessonProgress[LESSON])).toBe("not_started");

    service.openLesson(LESSON);
    expect(store.getState().lastLessonId).toBe(LESSON);
    expect(getLessonStatus(store.getState().lessonProgress[LESSON])).toBe("learning");
  });

  it("ders okunup alıştırmalar bitince ders tamamlanır; ustalıktan bağımsızdır", async () => {
    const { store, service } = setup();
    await store.hydrate();
    service.openLesson(LESSON);
    expect(isLessonCompleted(store.getState().lessonProgress[LESSON])).toBe(false);

    service.markLessonRead(LESSON);
    expect(isLessonCompleted(store.getState().lessonProgress[LESSON])).toBe(false); // alıştırma bitmedi

    const session = service.newSessionId();
    for (const q of lesson.exercises) service.submitAnswer(q, correctResponse(q), { sessionId: session, mode: "practice" });
    expect(service.finishPractice(LESSON, lesson.exercises.length, lesson.exercises.length)).toBe(true);

    const progress = store.getState().lessonProgress[LESSON];
    expect(isLessonCompleted(progress)).toBe(true);
    expect(getLessonStatus(progress)).toBe("practice_done");
    expect(store.getState().attempts).toHaveLength(lesson.exercises.length);
    expect(store.getState().attempts.every((a) => a.mode === "practice" && a.sessionId === session && a.isCorrect)).toBe(true);
    expect(store.getState().examResults).toEqual([]); // alıştırma sınav sonucu değildir
  });

  it("çok az soru cevaplanırsa alıştırmalar tamamlanmış sayılmaz", async () => {
    const { store, service } = setup();
    await store.hydrate();
    expect(service.finishPractice(LESSON, 5, lesson.exercises.length)).toBe(false);
    expect(store.getState().lessonProgress[LESSON]?.practiceCompletedAt).toBeUndefined();
  });

  it("yanlış cevap yanlışlar defterine tekrar yazılmadan işlenir; doğru çözülünce çözüldü olur", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const q = lesson.exercises[0];
    const ctx = { sessionId: "s", mode: "practice" as const };

    const first = service.submitAnswer(q, wrongResponse(q), ctx);
    expect(first.isCorrect).toBe(false);
    service.submitAnswer(q, wrongResponse(q), ctx);
    expect(Object.keys(store.getState().mistakes)).toEqual([q.id]);
    expect(store.getState().mistakes[q.id]).toMatchObject({ wrongCount: 2, resolved: false });

    service.submitAnswer(q, correctResponse(q), { sessionId: "s2", mode: "mistakes" });
    expect(store.getState().mistakes[q.id]).toMatchObject({ wrongCount: 2, resolved: true });
    expect(store.getState().attempts).toHaveLength(3);
  });

  it("sınav puanlanır, her deneme ayrı kaydedilir ve atlanan soru yanlış sayılmaz", async () => {
    const { store, service } = setup();
    await store.hydrate();
    const qs = lesson.exam.questions;
    const responses = Object.fromEntries(qs.map((q, i) => [q.id, i === 0 ? wrongResponse(q) : i === 1 ? null : correctResponse(q)]));

    const result = service.submitExam({ examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: qs, responses, startedAt: 1, sessionId: "s" });
    expect(result).toMatchObject({ total: qs.length, correct: qs.length - 2, wrong: 1, skipped: 1 });
    expect(result.percent).toBe(Math.round(((qs.length - 2) / qs.length) * 100));

    const state = store.getState();
    expect(Object.keys(state.mistakes)).toEqual([qs[0].id]); // yalnızca yanlış olan; atlanan yok
    expect(state.attempts).toHaveLength(qs.length - 1); // atlanan soru geçmişe yazılmaz
    expect(state.attempts.every((a) => a.mode === "exam")).toBe(true);
    expect(getLessonStatus(state.lessonProgress[LESSON])).toBe("exam_done");

    // İkinci deneme ilkini değiştirmez, ayrı kayıt olur.
    const all = Object.fromEntries(qs.map((q) => [q.id, correctResponse(q)]));
    const second = service.submitExam({ examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: qs, responses: all, startedAt: 2, sessionId: "s2" });
    expect(second.percent).toBe(100);
    expect(store.getState().examResults).toHaveLength(2);
    expect(store.getState().examResults[0]).toEqual(result);
    expect(store.getState().mistakes[qs[0].id].resolved).toBe(true);
  });

  it("uygulama yeniden açıldığında ilerleme korunur", async () => {
    const memory = createMemoryStore();
    const first = setup(memory);
    await first.store.hydrate();
    first.service.openLesson(LESSON);
    first.service.markLessonRead(LESSON);
    const q = lesson.exercises[0];
    first.service.submitAnswer(q, wrongResponse(q), { sessionId: "s", mode: "practice" });
    const qs = lesson.exam.questions;
    first.service.submitExam({
      examId: lesson.exam.id, lessonId: LESSON, kind: "lesson", questions: qs, startedAt: 1, sessionId: "s",
      responses: Object.fromEntries(qs.map((x) => [x.id, correctResponse(x)])),
    });
    await first.store.flush();

    const reopened = setup(memory);
    expect(await reopened.store.hydrate()).toBe("loaded");
    const state = reopened.store.getState();
    expect(state).toEqual(first.store.getState());
    expect(state.lastLessonId).toBe(LESSON);
    expect(state.mistakes[q.id].wrongCount).toBe(1);
    expect(state.examResults).toHaveLength(1);
    expect(getLessonStatus(state.lessonProgress[LESSON])).toBe("exam_done");
  });
});
