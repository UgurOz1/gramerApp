import type { ExamQuestionResult, ExamResult, Question, QuestionType } from "@/domain/models";
import { evaluateAnswer, isResponseComplete, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";

/** null: atlandı (ya da cevaplanmadı). */
export type ExamResponses = Record<string, AnswerResponse | null | undefined>;

export type ScoredExam = {
  result: ExamResult;
  /** Yalnızca cevaplanan sorular için değerlendirme. */
  evaluations: Record<string, Evaluation>;
};

/**
 * Sınavı puanlar. Atlanan sorular yanlış sayılmaz; ayrı sayılır ancak
 * başarı yüzdesi toplam soru sayısı üzerinden hesaplanır.
 */
export function scoreExam(args: {
  resultId: string;
  examId: string;
  lessonId: string | null;
  kind: ExamResult["kind"];
  questions: Question[];
  responses: ExamResponses;
  startedAt: number;
  finishedAt: number;
}): ScoredExam {
  const evaluations: Record<string, Evaluation> = {};
  const questionResults: ExamQuestionResult[] = [];
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const q of args.questions) {
    const response = args.responses[q.id];
    if (!isResponseComplete(response ?? null)) {
      skipped++;
      questionResults.push({ questionId: q.id, lessonId: q.lessonId, questionType: q.type, isCorrect: null, answer: null });
      continue;
    }
    const evaluation = evaluateAnswer(q, response as AnswerResponse);
    evaluations[q.id] = evaluation;
    if (evaluation.isCorrect) correct++;
    else wrong++;
    questionResults.push({
      questionId: q.id,
      lessonId: q.lessonId,
      questionType: q.type,
      isCorrect: evaluation.isCorrect,
      answer: evaluation.selectedAnswer,
    });
  }

  const total = args.questions.length;
  return {
    evaluations,
    result: {
      resultId: args.resultId,
      examId: args.examId,
      lessonId: args.lessonId,
      kind: args.kind,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      total,
      correct,
      wrong,
      skipped,
      percent: total === 0 ? 0 : Math.round((correct / total) * 100),
      questionResults,
    },
  };
}

export type TypeBreakdown = Partial<Record<QuestionType, { correct: number; total: number }>>;

/** Soru türüne göre doğru/toplam (atlananlar toplama dahil). */
export function breakdownByType(results: ExamQuestionResult[]): TypeBreakdown {
  const out: TypeBreakdown = {};
  for (const r of results) {
    const entry = (out[r.questionType] ??= { correct: 0, total: 0 });
    entry.total++;
    if (r.isCorrect) entry.correct++;
  }
  return out;
}
