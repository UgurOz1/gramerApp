import type { Question } from "@/domain/models";

import { normalizeAnswer } from "./normalize";

/** Kullanıcının bir soruya verdiği cevap. Tür, sorunun türüyle eşleşmelidir. */
export type AnswerResponse =
  | { type: "multiple_choice"; optionId: string }
  | { type: "fill_blank" | "error_correction" | "translation"; text: string }
  | { type: "sentence_building"; tokens: string[] };

export type Evaluation = {
  isCorrect: boolean;
  /** Geçmişte saklanan, okunabilir cevap (seçenek metni, yazılan metin veya kurulan cümle). */
  selectedAnswer: string;
  normalizedAnswer: string;
  /** Gösterilecek doğru cevap. */
  correctAnswer: string;
  /** Kabul edilen diğer cevaplar (varsa). */
  alternativeAnswers: string[];
  /** Verilen yanlış cevaba özel geri bildirim (varsa). */
  feedback: string | null;
};

/** Cevap gönderilebilecek kadar tamamlanmış mı? */
export function isResponseComplete(response: AnswerResponse | null): response is AnswerResponse {
  if (!response) return false;
  switch (response.type) {
    case "multiple_choice":
      return response.optionId !== "";
    case "sentence_building":
      return response.tokens.length > 0;
    default:
      return response.text.trim() !== "";
  }
}

function sentenceText(tokens: string[], punctuation: string): string {
  return `${tokens.join(" ")}${punctuation}`;
}

/** Sorunun gösterilecek doğru cevabı ve kabul edilen diğer cevapları. */
export function describeCorrectAnswer(question: Question): { correctAnswer: string; alternativeAnswers: string[] } {
  switch (question.type) {
    case "multiple_choice":
      return { correctAnswer: question.options.find((o) => o.id === question.correctOptionId)?.text ?? "", alternativeAnswers: [] };
    case "sentence_building":
      return {
        correctAnswer: sentenceText(question.answer, question.endPunctuation),
        alternativeAnswers: (question.alternativeAnswers ?? []).map((a) => sentenceText(a, question.endPunctuation)),
      };
    default:
      return { correctAnswer: question.answers[0], alternativeAnswers: question.answers.slice(1) };
  }
}

/** Cevap metnini, soruya ait yanlış cevap geri bildirimleriyle eşleştirir. */
export function findAnswerFeedback(question: Question, selectedAnswer: string): string | null {
  switch (question.type) {
    case "multiple_choice": {
      const option = question.options.find((o) => o.text === selectedAnswer);
      return option ? (question.optionExplanations[option.id] ?? null) : null;
    }
    case "fill_blank":
    case "error_correction":
    case "translation": {
      const n = normalizeAnswer(selectedAnswer);
      return question.wrongAnswerFeedback?.find((f) => normalizeAnswer(f.answer) === n)?.explanation ?? null;
    }
    case "sentence_building":
      return null;
  }
}

/**
 * Cevabı değerlendirir. UI'dan bağımsız saf fonksiyondur.
 * Kabul edilen cevaplar içerikte açıkça tanımlıdır; listelenmeyen alternatifler
 * (ör. "does not" yerine "doesn't") otomatik doğru sayılmaz.
 */
export function evaluateAnswer(question: Question, response: AnswerResponse): Evaluation {
  if (question.type !== response.type) {
    throw new Error(`Cevap türü (${response.type}) soru türüyle (${question.type}) eşleşmiyor`);
  }

  switch (question.type) {
    case "multiple_choice": {
      const r = response as Extract<AnswerResponse, { type: "multiple_choice" }>;
      const selected = question.options.find((o) => o.id === r.optionId);
      const selectedAnswer = selected?.text ?? "";
      const isCorrect = !!selected && selected.id === question.correctOptionId;
      return {
        isCorrect,
        selectedAnswer,
        normalizedAnswer: normalizeAnswer(selectedAnswer),
        ...describeCorrectAnswer(question),
        feedback: isCorrect ? null : findAnswerFeedback(question, selectedAnswer),
      };
    }
    case "sentence_building": {
      const r = response as Extract<AnswerResponse, { type: "sentence_building" }>;
      const accepted = [question.answer, ...(question.alternativeAnswers ?? [])];
      const isCorrect = accepted.some((a) => a.length === r.tokens.length && a.every((t, i) => t === r.tokens[i]));
      const selectedAnswer = sentenceText(r.tokens, question.endPunctuation);
      return {
        isCorrect,
        selectedAnswer,
        normalizedAnswer: normalizeAnswer(selectedAnswer),
        ...describeCorrectAnswer(question),
        feedback: null,
      };
    }
    default: {
      const r = response as Extract<AnswerResponse, { text: string }>;
      const normalizedAnswer = normalizeAnswer(r.text);
      const isCorrect = question.answers.some((a) => normalizeAnswer(a) === normalizedAnswer);
      return {
        isCorrect,
        selectedAnswer: r.text.trim(),
        normalizedAnswer,
        ...describeCorrectAnswer(question),
        feedback: isCorrect ? null : findAnswerFeedback(question, r.text),
      };
    }
  }
}
