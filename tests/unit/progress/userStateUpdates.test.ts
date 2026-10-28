import type { AnswerAttempt, ExamResult } from "@/domain/models";
import {
  MAX_ATTEMPTS,
  addToReviewList,
  dismissMistake,
  markLessonOpened,
  markLessonStep,
  recordAnswer,
  recordExamResult,
  removeFromReviewList,
} from "@/domain/progress/userStateUpdates";
import { createDefaultUserState } from "@/services/storage/userStateSchema";

let seq = 0;
function attempt(over: Partial<AnswerAttempt> = {}): AnswerAttempt {
  seq++;
  return {
    attemptId: `att-${seq}`,
    questionId: "q-1",
    lessonId: "a1-to-be",
    questionType: "fill_blank",
    selectedAnswer: "is",
    normalizedAnswer: "is",
    isCorrect: false,
    timestamp: 1000 + seq,
    sessionId: "s-1",
    mode: "practice",
    ...over,
  };
}

describe("yanlışlar defteri", () => {
  it("aynı soru tekrar yanlış cevaplanınca kopya oluşturmadan günceller", () => {
    let s = createDefaultUserState();
    s = recordAnswer(s, attempt({ selectedAnswer: "is", timestamp: 10 }));
    s = recordAnswer(s, attempt({ selectedAnswer: "be", timestamp: 20 }));
    expect(Object.keys(s.mistakes)).toEqual(["q-1"]);
    expect(s.mistakes["q-1"]).toMatchObject({
      wrongCount: 2,
      lastWrongAnswer: "be",
      firstWrongAt: 10,
      lastWrongAt: 20,
      resolved: false,
    });
    expect(s.attempts).toHaveLength(2);
  });

  it("doğru cevap kaydı silmez, çözüldü olarak işaretler", () => {
    let s = recordAnswer(createDefaultUserState(), attempt());
    s = recordAnswer(s, attempt({ isCorrect: true, selectedAnswer: "are", timestamp: 99 }));
    expect(s.mistakes["q-1"]).toMatchObject({ resolved: true, wrongCount: 1, lastAnsweredAt: 99 });
  });

  it("hiç yanlış yapılmamış soru doğru cevaplanınca kayıt oluşmaz", () => {
    const s = recordAnswer(createDefaultUserState(), attempt({ isCorrect: true }));
    expect(s.mistakes).toEqual({});
  });

  it("listeden kaldırma cevap geçmişini ve sınavları etkilemez; tekrar yanlış yapılınca kayıt geri gelir", () => {
    let s = recordAnswer(createDefaultUserState(), attempt());
    const before = s.attempts;
    s = dismissMistake(s, "q-1");
    expect(s.mistakes["q-1"].dismissed).toBe(true);
    expect(s.attempts).toBe(before);
    s = recordAnswer(s, attempt());
    expect(s.mistakes["q-1"]).toMatchObject({ dismissed: false, wrongCount: 2 });
  });

  it("cevap geçmişi sınırı aşınca en eski kayıtlar silinir", () => {
    let s = createDefaultUserState();
    s = { ...s, attempts: Array.from({ length: MAX_ATTEMPTS }, () => attempt({ isCorrect: true })) };
    const firstId = s.attempts[0].attemptId;
    s = recordAnswer(s, attempt({ isCorrect: true }));
    expect(s.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(s.attempts[0].attemptId).not.toBe(firstId);
  });
});

describe("tekrar listesi", () => {
  it("aynı dersi iki kez eklemez", () => {
    let s = addToReviewList(createDefaultUserState(), "a1-to-be", 1);
    const again = addToReviewList(s, "a1-to-be", 2);
    expect(again).toBe(s);
    s = addToReviewList(s, "a1-present-simple", 3);
    expect(s.reviewList.map((r) => r.lessonId)).toEqual(["a1-to-be", "a1-present-simple"]);
  });

  it("dersi listeden çıkarır ve yanlışlar listesini etkilemez", () => {
    let s = recordAnswer(createDefaultUserState(), attempt());
    s = addToReviewList(s, "a1-to-be", 1);
    s = removeFromReviewList(s, "a1-to-be");
    expect(s.reviewList).toEqual([]);
    expect(s.mistakes["q-1"]).toBeDefined();
  });
});

describe("ders ilerlemesi", () => {
  it("ders açılışını ve son dersi kaydeder", () => {
    let s = markLessonOpened(createDefaultUserState(), "a1-to-be", 5);
    s = markLessonOpened(s, "a1-to-be", 9);
    expect(s.lastLessonId).toBe("a1-to-be");
    expect(s.lessonProgress["a1-to-be"]).toEqual({ lessonId: "a1-to-be", firstOpenedAt: 5, lastOpenedAt: 9 });
  });

  it("ilk tamamlama tarihini korur", () => {
    let s = markLessonStep(createDefaultUserState(), "a1-to-be", "readAt", 10);
    s = markLessonStep(s, "a1-to-be", "readAt", 20);
    expect(s.lessonProgress["a1-to-be"].readAt).toBe(10);
  });

  it("her sınav denemesini ayrı kaydeder ve dersin sınavını tamamlandı sayar", () => {
    const result: ExamResult = {
      resultId: "r1",
      examId: "exam-a1-to-be",
      lessonId: "a1-to-be",
      kind: "lesson",
      startedAt: 1,
      finishedAt: 2,
      total: 2,
      correct: 1,
      wrong: 1,
      skipped: 0,
      percent: 50,
      questionResults: [],
    };
    let s = recordExamResult(createDefaultUserState(), result);
    s = recordExamResult(s, { ...result, resultId: "r2", finishedAt: 3, percent: 100 });
    expect(s.examResults.map((r) => r.resultId)).toEqual(["r1", "r2"]);
    expect(s.lessonProgress["a1-to-be"].examCompletedAt).toBe(2);
  });
});
