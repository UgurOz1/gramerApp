import type { AnswerAttempt, AnswerMode, Question } from "@/domain/models";

import type { Evaluation } from "./evaluate";

export function createAttempt(args: {
  attemptId: string;
  question: Question;
  evaluation: Evaluation;
  sessionId: string;
  mode: AnswerMode;
  timestamp: number;
}): AnswerAttempt {
  const { question, evaluation } = args;
  return {
    attemptId: args.attemptId,
    questionId: question.id,
    lessonId: question.lessonId,
    questionType: question.type,
    selectedAnswer: evaluation.selectedAnswer,
    normalizedAnswer: evaluation.normalizedAnswer,
    isCorrect: evaluation.isCorrect,
    timestamp: args.timestamp,
    sessionId: args.sessionId,
    mode: args.mode,
  };
}
