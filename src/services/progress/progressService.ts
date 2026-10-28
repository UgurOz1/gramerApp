import { PRACTICE_COMPLETION_MIN_ANSWERED_RATIO } from "@/constants/progress";
import type { AnswerMode, ExamResult, Question } from "@/domain/models";
import {
  markLessonOpened,
  markLessonStep,
  recordAnswer,
  recordExamResult,
} from "@/domain/progress/userStateUpdates";
import { createAttempt } from "@/domain/question-engine/attempt";
import { evaluateAnswer, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";
import { scoreExam, type ExamResponses } from "@/domain/scoring/examScoring";

import { userStore, type UserStore } from "./userStore";

type Deps = {
  store: UserStore;
  now?: () => number;
  /** Benzersiz kimlik üretici. */
  newId?: (prefix: string) => string;
};

let counter = 0;
const defaultNewId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Ekranların kullandığı tek ilerleme servisi: cevapları değerlendirir ve
 * kullanıcı durumunu saf güncelleme fonksiyonlarıyla günceller.
 */
export function createProgressService({ store, now = Date.now, newId = defaultNewId }: Deps) {
  return {
    newSessionId: () => newId("session"),

    openLesson(lessonId: string) {
      store.update((s) => markLessonOpened(s, lessonId, now()));
    },

    markLessonRead(lessonId: string) {
      store.update((s) => markLessonStep(s, lessonId, "readAt", now()));
    },

    /** Tek bir soruyu değerlendirir ve cevabı geçmişe işler (alıştırma, ders içi kontrol vb.). */
    submitAnswer(question: Question, response: AnswerResponse, ctx: { sessionId: string; mode: AnswerMode }): Evaluation {
      const evaluation = evaluateAnswer(question, response);
      const attempt = createAttempt({
        attemptId: newId("att"),
        question,
        evaluation,
        sessionId: ctx.sessionId,
        mode: ctx.mode,
        timestamp: now(),
      });
      store.update((s) => recordAnswer(s, attempt));
      return evaluation;
    },

    /** Alıştırma turu bitti. Yeterli sayıda soru cevaplandıysa alıştırmalar tamamlanmış sayılır. */
    finishPractice(lessonId: string, answered: number, total: number): boolean {
      const completed = total > 0 && answered / total >= PRACTICE_COMPLETION_MIN_ANSWERED_RATIO;
      if (completed) store.update((s) => markLessonStep(s, lessonId, "practiceCompletedAt", now()));
      return completed;
    },

    /**
     * Sınavı puanlar, cevapları geçmişe işler ve sonucu ayrı bir kayıt olarak saklar.
     * Sınav sırasında cevaplar kaydedilmediği için doğru cevaplar önceden sızmaz.
     */
    submitExam(args: {
      examId: string;
      lessonId: string | null;
      kind: ExamResult["kind"];
      questions: Question[];
      responses: ExamResponses;
      startedAt: number;
      sessionId: string;
    }): ExamResult {
      const finishedAt = now();
      const { result, evaluations } = scoreExam({
        resultId: newId("result"),
        examId: args.examId,
        lessonId: args.lessonId,
        kind: args.kind,
        questions: args.questions,
        responses: args.responses,
        startedAt: args.startedAt,
        finishedAt,
      });
      store.update((s) => {
        let next = s;
        for (const q of args.questions) {
          const evaluation = evaluations[q.id];
          if (!evaluation) continue; // atlanan soru yanlış sayılmaz
          next = recordAnswer(
            next,
            createAttempt({
              attemptId: newId("att"),
              question: q,
              evaluation,
              sessionId: args.sessionId,
              mode: "exam",
              timestamp: finishedAt,
            }),
          );
        }
        return recordExamResult(next, result);
      });
      return result;
    },
  };
}

export type ProgressService = ReturnType<typeof createProgressService>;

export const progressService = createProgressService({ store: userStore });
