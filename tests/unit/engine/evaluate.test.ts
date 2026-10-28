import type {
  ErrorCorrectionQuestion,
  FillBlankQuestion,
  MultipleChoiceQuestion,
  SentenceBuildingQuestion,
  TranslationQuestion,
} from "@/domain/models";
import { evaluateAnswer, isResponseComplete } from "@/domain/question-engine/evaluate";
import { seededShuffle, shuffleDifferent } from "@/domain/question-engine/shuffle";

const base = { lessonId: "l", levelId: "a1" as const, difficulty: 1 as const, explanation: "x", tags: [], errorTags: [] };

const mc: MultipleChoiceQuestion = {
  ...base,
  id: "mc",
  type: "multiple_choice",
  prompt: "She ___ a student.",
  options: [
    { id: "a", text: "am" },
    { id: "b", text: "is" },
    { id: "c", text: "are" },
  ],
  correctOptionId: "b",
  optionExplanations: { a: "Am yalnızca I ile.", c: "Are you/we/they ile." },
};

const fill: FillBlankQuestion = {
  ...base,
  id: "fill",
  type: "fill_blank",
  prompt: "She ___ at home.",
  answers: ["isn't", "is not"],
  wrongAnswerFeedback: [{ answer: "not", explanation: "to be de gerekir" }],
};

const build: SentenceBuildingQuestion = {
  ...base,
  id: "build",
  type: "sentence_building",
  prompt: "Cümleyi kur.",
  answer: ["Is", "she", "a", "student", "or", "is", "she", "a", "teacher"],
  alternativeAnswers: [["Is", "she", "a", "teacher", "or", "is", "she", "a", "student"]],
  endPunctuation: "?",
};

const fix: ErrorCorrectionQuestion = {
  ...base,
  id: "fix",
  type: "error_correction",
  prompt: "Düzelt.",
  incorrectSentence: "She teacher.",
  answers: ["She is a teacher.", "She's a teacher."],
};

const trans: TranslationQuestion = {
  ...base,
  id: "trans",
  type: "translation",
  prompt: "Çevir.",
  source: "O öğretmen.",
  targetStructure: "to be",
  answers: ["She is a teacher.", "She's a teacher."],
};

describe("çoktan seçmeli", () => {
  it("doğru seçeneği kabul eder", () => {
    const e = evaluateAnswer(mc, { type: "multiple_choice", optionId: "b" });
    expect(e).toMatchObject({ isCorrect: true, selectedAnswer: "is", correctAnswer: "is", feedback: null });
  });

  it("yanlış seçenek için o seçeneğin açıklamasını döndürür", () => {
    const e = evaluateAnswer(mc, { type: "multiple_choice", optionId: "c" });
    expect(e.isCorrect).toBe(false);
    expect(e.feedback).toBe("Are you/we/they ile.");
    expect(e.correctAnswer).toBe("is");
  });

  it("olmayan seçeneği yanlış sayar", () => {
    expect(evaluateAnswer(mc, { type: "multiple_choice", optionId: "zzz" }).isCorrect).toBe(false);
  });
});

describe("boşluk doldurma", () => {
  it.each(["isn't", "  ISN'T ", "isn’t", "is not", "Is   not."])("kabul edilen cevap: %p", (text) => {
    expect(evaluateAnswer(fill, { type: "fill_blank", text }).isCorrect).toBe(true);
  });

  it("listelenmeyen alternatifi otomatik doğru saymaz", () => {
    expect(evaluateAnswer(fill, { type: "fill_blank", text: "'s not" }).isCorrect).toBe(false);
    expect(evaluateAnswer(fill, { type: "fill_blank", text: "is" }).isCorrect).toBe(false);
  });

  it("cevaba özel geri bildirimi döndürür", () => {
    const e = evaluateAnswer(fill, { type: "fill_blank", text: "Not" });
    expect(e).toMatchObject({ isCorrect: false, feedback: "to be de gerekir", correctAnswer: "isn't", alternativeAnswers: ["is not"] });
  });

  it("geçmiş için okunabilir ve normalize cevabı saklar", () => {
    const e = evaluateAnswer(fill, { type: "fill_blank", text: "  Is NOT. " });
    expect(e.selectedAnswer).toBe("Is NOT.");
    expect(e.normalizedAnswer).toBe("is not");
  });
});

describe("cümle kurma", () => {
  it("doğru sırayı kabul eder", () => {
    const e = evaluateAnswer(build, { type: "sentence_building", tokens: build.answer });
    expect(e).toMatchObject({ isCorrect: true, correctAnswer: "Is she a student or is she a teacher?" });
  });

  it("tanımlı alternatif sıralamayı kabul eder", () => {
    expect(evaluateAnswer(build, { type: "sentence_building", tokens: build.alternativeAnswers![0] }).isCorrect).toBe(true);
  });

  it("yinelenen kelimelerde büyük/küçük harf farklı parçaları ayırt eder", () => {
    const swapped = ["is", "she", "a", "student", "or", "Is", "she", "a", "teacher"];
    expect(evaluateAnswer(build, { type: "sentence_building", tokens: swapped }).isCorrect).toBe(false);
  });

  it("eksik veya fazla parçayı yanlış sayar", () => {
    expect(evaluateAnswer(build, { type: "sentence_building", tokens: build.answer.slice(0, -1) }).isCorrect).toBe(false);
    expect(evaluateAnswer(build, { type: "sentence_building", tokens: [...build.answer, "x"] }).isCorrect).toBe(false);
  });
});

describe("hata düzeltme ve çeviri", () => {
  it("tanımlı düzeltmeleri kabul eder, hatalı cümleyi kabul etmez", () => {
    expect(evaluateAnswer(fix, { type: "error_correction", text: "she's a teacher" }).isCorrect).toBe(true);
    expect(evaluateAnswer(fix, { type: "error_correction", text: "She teacher." }).isCorrect).toBe(false);
  });

  it("çeviride tanımlı alternatifleri kabul eder, tanımsız olanı kabul etmez", () => {
    expect(evaluateAnswer(trans, { type: "translation", text: "She's a teacher" }).isCorrect).toBe(true);
    expect(evaluateAnswer(trans, { type: "translation", text: "She is teacher." }).isCorrect).toBe(false);
  });
});

describe("genel", () => {
  it("tür uyuşmazlığında hata fırlatır", () => {
    expect(() => evaluateAnswer(mc, { type: "fill_blank", text: "is" })).toThrow();
  });

  it("cevabın tamamlanmış olup olmadığını denetler", () => {
    expect(isResponseComplete(null)).toBe(false);
    expect(isResponseComplete({ type: "fill_blank", text: "   " })).toBe(false);
    expect(isResponseComplete({ type: "fill_blank", text: "is" })).toBe(true);
    expect(isResponseComplete({ type: "sentence_building", tokens: [] })).toBe(false);
    expect(isResponseComplete({ type: "multiple_choice", optionId: "" })).toBe(false);
  });
});

describe("karıştırma", () => {
  it("aynı tohumla aynı sonucu verir ve parçaları korur", () => {
    const items = ["a", "b", "c", "d", "e", "f"];
    expect(seededShuffle(items, "q1")).toEqual(seededShuffle(items, "q1"));
    expect([...seededShuffle(items, "q1")].sort()).toEqual(items);
  });

  it("karıştırılan sıra doğru sıradan farklı olur", () => {
    const items = ["Is", "he", "your", "brother"];
    for (const seed of ["a", "b", "c", "q-to-be-15", "q-to-be-20"]) {
      expect(shuffleDifferent(items, seed)).not.toEqual(items);
    }
  });
});
