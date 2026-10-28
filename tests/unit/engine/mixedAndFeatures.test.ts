import { buildMixedTest, countAvailableQuestions } from "@/domain/mixed/buildMixedTest";
import type { Curriculum, MistakeRecord, Question } from "@/domain/models";
import { buildMistakeItems, topMistakeLessons, unresolvedItems } from "@/features/mistakes/viewModel";
import { resolveScopeLessons } from "@/features/mixed/scope";
import { levelProgress, lessonProgressValue, quickStats } from "@/features/progress/summary";
import { suggestToday } from "@/features/progress/suggestion";
import rawCurriculum from "@/assets/data/curriculum.json";
import { getLessonContent } from "@/data/contentRepository";

const lesson = getLessonContent("a1-to-be")!;
const curriculum = rawCurriculum as Curriculum;

/** Test için sahte soru havuzu: iki ders, farklı türler. */
const fake = (lessonId: string, i: number, type: Question["type"] = "fill_blank"): Question =>
  ({ id: `${lessonId}-${i}`, lessonId, levelId: "a1", type, difficulty: 1, prompt: "x ___", answers: ["a"], explanation: "e", tags: [], errorTags: [] }) as Question;

describe("buildMixedTest", () => {
  const pool = [
    ...Array.from({ length: 10 }, (_, i) => fake("l1", i)),
    ...Array.from({ length: 10 }, (_, i) => fake("l2", i)),
    ...Array.from({ length: 4 }, (_, i) => fake("l3", i, "translation")),
  ];
  const types = ["fill_blank", "translation"] as const;

  it("istenen sayıda, yinelenmeyen soru döndürür", () => {
    const t = buildMixedTest(pool, { questionTypes: [...types], count: 12, seed: "a" });
    expect(t).toHaveLength(12);
    expect(new Set(t.map((q) => q.id)).size).toBe(12);
  });

  it("konulara dengeli dağıtır", () => {
    const t = buildMixedTest(pool, { questionTypes: [...types], count: 9, seed: "a" });
    const counts = t.reduce<Record<string, number>>((a, q) => ((a[q.lessonId] = (a[q.lessonId] ?? 0) + 1), a), {});
    expect(counts).toEqual({ l1: 3, l2: 3, l3: 3 });
  });

  it("yalnızca seçilen soru türlerini kullanır", () => {
    const t = buildMixedTest(pool, { questionTypes: ["translation"], count: 10, seed: "a" });
    expect(t).toHaveLength(4);
    expect(t.every((q) => q.type === "translation")).toBe(true);
  });

  it("aynı tohumla aynı testi, farklı tohumla farklı testi üretir", () => {
    const opts = { questionTypes: [...types], count: 10 };
    const a = buildMixedTest(pool, { ...opts, seed: "x" }).map((q) => q.id);
    expect(buildMixedTest(pool, { ...opts, seed: "x" }).map((q) => q.id)).toEqual(a);
    expect(buildMixedTest(pool, { ...opts, seed: "y" }).map((q) => q.id)).not.toEqual(a);
  });

  it("havuz yetersizse eldekini verir; soru sayısını bildirir", () => {
    expect(buildMixedTest(pool, { questionTypes: [...types], count: 100, seed: "a" })).toHaveLength(24);
    expect(countAvailableQuestions(pool, ["translation"])).toBe(4);
    expect(countAvailableQuestions(pool, [])).toBe(0);
  });

  it("gerçek ders içeriğinden her soru türüyle test kurulabilir", () => {
    const all = [...lesson.exercises, ...lesson.exam.questions];
    const t = buildMixedTest(all, { questionTypes: ["multiple_choice", "fill_blank", "sentence_building", "error_correction", "translation"], count: 15, seed: "s" });
    expect(t).toHaveLength(15);
    expect(new Set(t.map((q) => q.type)).size).toBeGreaterThan(2);
  });
});

describe("resolveScopeLessons", () => {
  const mk = (id: string, over: Partial<MistakeRecord> = {}): MistakeRecord => ({
    questionId: id, lessonId: "a1-to-be", lastWrongAnswer: "x", wrongCount: 1, firstWrongAt: 1, lastWrongAt: 1, lastAnsweredAt: 1, resolved: false, dismissed: false, ...over,
  });
  const base = { curriculum, availableLessonIds: new Set(["a1-to-be", "a2-past-simple"]), mistakes: {}, reviewList: [] };

  it("yalnızca içeriği hazır dersleri döndürür", () => {
    expect(resolveScopeLessons({ kind: "all" }, base)).toEqual(["a1-to-be", "a2-past-simple"]);
    expect(resolveScopeLessons({ kind: "level", levelId: "a2" }, base)).toEqual(["a2-past-simple"]);
    expect(resolveScopeLessons({ kind: "units", unitIds: ["a1-unit-01"] }, base)).toEqual(["a1-to-be"]);
    expect(resolveScopeLessons({ kind: "lessons", lessonIds: ["a2-past-simple", "a1-present-simple"] }, base)).toEqual(["a2-past-simple"]);
  });

  it("yanlış yapılan konular yalnızca çözülmemiş ve kaldırılmamış yanlışlardan gelir", () => {
    const ctx = (m: Record<string, MistakeRecord>) => ({ ...base, mistakes: m });
    expect(resolveScopeLessons({ kind: "mistakes" }, ctx({ q1: mk("q1") }))).toEqual(["a1-to-be"]);
    expect(resolveScopeLessons({ kind: "mistakes" }, ctx({ q1: mk("q1", { resolved: true }) }))).toEqual([]);
    expect(resolveScopeLessons({ kind: "mistakes" }, ctx({ q1: mk("q1", { dismissed: true }) }))).toEqual([]);
  });

  it("tekrar listesi kapsamı kullanıcının eklediği konulardır", () => {
    expect(resolveScopeLessons({ kind: "review" }, { ...base, reviewList: [{ lessonId: "a2-past-simple", addedAt: 1 }] })).toEqual(["a2-past-simple"]);
  });
});

describe("yanlışlar görünümü", () => {
  const rec = (id: string, over: Partial<MistakeRecord> = {}): MistakeRecord => ({
    questionId: id, lessonId: "a1-to-be", lastWrongAnswer: "x", wrongCount: 1, firstWrongAt: 1, lastWrongAt: 1, lastAnsweredAt: 1, resolved: false, dismissed: false, ...over,
  });
  const q = (id: string) => lesson.exercises.find((x) => x.id === id);

  it("kaldırılan ve içeriği olmayanları gizler, çözülmemişleri önce sıralar", () => {
    const [a, b, c] = lesson.exercises;
    const items = buildMistakeItems(
      {
        [a.id]: rec(a.id, { resolved: true, wrongCount: 5 }),
        [b.id]: rec(b.id, { wrongCount: 1, lastWrongAt: 10 }),
        [c.id]: rec(c.id, { wrongCount: 3, lastWrongAt: 5 }),
        yok: rec("yok"),
        [lesson.exercises[3].id]: rec(lesson.exercises[3].id, { dismissed: true }),
      },
      q,
    );
    expect(items.map((i) => i.record.questionId)).toEqual([c.id, b.id, a.id]);
    expect(unresolvedItems(items)).toHaveLength(2);
  });

  it("en çok hata yapılan konuları sıralar", () => {
    const [a, b] = lesson.exercises;
    const items = buildMistakeItems({ [a.id]: rec(a.id, { wrongCount: 2 }), [b.id]: rec(b.id, { wrongCount: 4 }) }, q);
    expect(topMistakeLessons(items)).toEqual([{ lessonId: "a1-to-be", count: 2, wrongTotal: 6 }]);
  });
});

describe("ilerleme özeti", () => {
  const m = (band: any, score: number) => ({ lessonId: "x", band, score, answeredCount: 20, examTaken: true, components: { practice: 0, exam: 0, variety: 0 } });
  const done = { lessonId: "x", firstOpenedAt: 1, lastOpenedAt: 1, readAt: 2, practiceCompletedAt: 3 };

  it("ders ilerlemesi: yarı tamamlama, yarı ustalık", () => {
    expect(lessonProgressValue(done, m("strong", 100))).toBe(1);
    expect(lessonProgressValue(done, m("not_enough_data", 90))).toBe(0.5);
    expect(lessonProgressValue(undefined, undefined)).toBe(0);
    expect(lessonProgressValue({ ...done, practiceCompletedAt: undefined }, m("good", 60))).toBeCloseTo(0.3);
  });

  it("seviye ilerlemesi içeriği hazır olmayan dersleri 0 sayar", () => {
    const lessons = curriculum.lessons.filter((l) => l.levelId === "a1").slice(0, 4);
    const res = levelProgress(lessons, { lessonProgress: { [lessons[0].id]: { ...done, lessonId: lessons[0].id } } }, { [lessons[0].id]: m("strong", 100) });
    expect(res).toMatchObject({ completed: 1, total: 4, available: 1 });
    expect(res.value).toBeCloseTo(0.25);
  });

  it("hızlı istatistikler", () => {
    expect(quickStats({ attempts: [], lessonProgress: {} })).toEqual({ answered: 0, correct: 0, accuracy: null, completedLessons: 0 });
  });
});

describe("suggestToday", () => {
  const base = { unresolvedMistakeCount: 0, reviewNeededLessonIds: [], reviewListLessonIds: [], inProgressLessonIds: [], newLessonIds: [], availableLessonCount: 1, titleOf: (id: string) => id.toUpperCase() };

  it("öncelik sırası: yanlışlar → tekrar gerekli → tekrar listesi → devam → yeni konu → karışık", () => {
    expect(suggestToday({ ...base, unresolvedMistakeCount: 3, reviewNeededLessonIds: ["a"] }).kind).toBe("mistakes");
    expect(suggestToday({ ...base, unresolvedMistakeCount: 2, reviewNeededLessonIds: ["a"], reviewListLessonIds: ["b"] })).toMatchObject({ kind: "review_lesson", lessonId: "a" });
    expect(suggestToday({ ...base, reviewListLessonIds: ["b"], inProgressLessonIds: ["c"] })).toMatchObject({ kind: "review_lesson", lessonId: "b" });
    expect(suggestToday({ ...base, inProgressLessonIds: ["c"], newLessonIds: ["d"] })).toMatchObject({ kind: "continue_lesson", lessonId: "c" });
    expect(suggestToday({ ...base, newLessonIds: ["d"] })).toMatchObject({ kind: "new_lesson", lessonId: "d" });
    expect(suggestToday(base).kind).toBe("mixed");
    expect(suggestToday({ ...base, availableLessonCount: 0 }).kind).toBe("none");
  });
});
