import rawCurriculum from "@/assets/data/curriculum.json";
import type { Curriculum } from "@/domain/models";
import { validateLessonContent } from "@/domain/validation/validateContent";

import { makeValidLesson } from "../../fixtures/lesson";

const curriculum = rawCurriculum as Curriculum;

/** Dersi bozan bir değişiklik uygular ve sorun mesajlarını döndürür. */
function issuesAfter(mutate: (l: any) => void): string[] {
  const lesson = makeValidLesson();
  mutate(lesson);
  return validateLessonContent(lesson, curriculum).issues.map((i) => `${i.path}: ${i.message}`);
}

describe("validateLessonContent", () => {
  it("geçerli dersi kabul eder", () => {
    expect(validateLessonContent(makeValidLesson(), curriculum)).toMatchObject({ ok: true, issues: [] });
  });

  it("müfredatta olmayan dersi yakalar", () => {
    expect(issuesAfter((l) => (l.id = "a1-olmayan")).join()).toMatch(/müfredatta bulunmuyor/);
  });

  it("seçeneklerde olmayan doğru cevabı yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[0].correctOptionId = "z")).join()).toMatch(/correctOptionId/);
  });

  it("açıklaması olmayan yanlış seçeneği yakalar", () => {
    expect(issuesAfter((l) => delete l.exercises[0].optionExplanations.a).join()).toMatch(/optionExplanations\.a/);
  });

  it("boşluğu olmayan boşluk doldurma sorusunu yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[1].prompt = "They not at home.")).join()).toMatch(/boşluğu/);
  });

  it("kabul edilen cevabı yanlış geri bildirim olarak tanımlamayı yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[1].wrongAnswerFeedback[0].answer = "Are")).join()).toMatch(/kabul edilen/);
  });

  it("cevapta da geçen çeldiriciyi yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[2].distractors = ["he"])).join()).toMatch(/çeldirici/);
  });

  it("farklı parçalardan oluşan alternatif sıralamayı yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[2].alternativeAnswers = [["Is", "he", "my", "brother"]])).join()).toMatch(
      /aynı parçalardan/,
    );
  });

  it("hatalı cümleyle aynı olan düzeltmeyi yakalar", () => {
    expect(issuesAfter((l) => l.exam.questions[0].answers.push("i is happy")).join()).toMatch(/aynı olamaz/);
  });

  it("normalize edildiğinde yinelenen cevabı yakalar", () => {
    expect(issuesAfter((l) => l.exam.questions[1].answers.push("we are not tired")).join()).toMatch(/yinelenen cevap/);
  });

  it("yinelenen soru kimliğini yakalar (alıştırma ve sınav arasında)", () => {
    expect(issuesAfter((l) => (l.exam.questions[0].id = "q-mc")).join()).toMatch(/yinelenen soru kimliği/);
  });

  it("olmayan örnek referansını yakalar", () => {
    expect(issuesAfter((l) => (l.sections[1].forms[0].exampleIds = ["ex-yok"])).join()).toMatch(/olmayan örnek/);
  });

  it("kontrol bölümünde alıştırmalarda olmayan soruyu yakalar", () => {
    expect(issuesAfter((l) => (l.sections[2].questionIds = ["q-exam-fix"])).join()).toMatch(/alıştırmalarda olmayan/);
  });

  it("yanlış derse bağlı soruyu yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[0].lessonId = "a1-present-simple")).join()).toMatch(/lessonId/);
  });

  it("bilinmeyen hata etiketini yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[0].errorTags = ["typo"])).join()).toMatch(/bilinmeyen hata etiketi/);
  });

  it("bilinmeyen soru türünü yakalar", () => {
    expect(issuesAfter((l) => (l.exercises[0].type = "matching")).join()).toMatch(/type/);
  });
});
