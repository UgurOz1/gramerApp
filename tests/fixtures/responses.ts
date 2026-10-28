import type { Question } from "@/domain/models";
import type { AnswerResponse } from "@/domain/question-engine/evaluate";

/** Sorunun birincil doğru cevabını cevap nesnesi olarak üretir. */
export function correctResponse(q: Question): AnswerResponse {
  switch (q.type) {
    case "multiple_choice":
      return { type: "multiple_choice", optionId: q.correctOptionId };
    case "sentence_building":
      return { type: "sentence_building", tokens: q.answer };
    default:
      return { type: q.type, text: q.answers[0] };
  }
}

/** Kesinlikle yanlış bir cevap üretir. */
export function wrongResponse(q: Question): AnswerResponse {
  switch (q.type) {
    case "multiple_choice":
      return { type: "multiple_choice", optionId: q.options.find((o) => o.id !== q.correctOptionId)!.id };
    case "sentence_building":
      return { type: "sentence_building", tokens: [...q.answer].reverse() };
    default:
      return { type: q.type, text: "zzz" };
  }
}
