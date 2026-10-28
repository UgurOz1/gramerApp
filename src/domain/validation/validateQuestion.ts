import {
  ERROR_TAGS,
  QUESTION_TYPES,
  type LevelId,
} from "@/domain/models";
import { normalizeAnswer } from "@/domain/question-engine/normalize";

import type { IssueCollector } from "./result";

export const BLANK = "___";

type Context = { lessonId: string; levelId: LevelId };

/**
 * Tek bir sorunun yapısını ve cevap anahtarının tutarlılığını denetler.
 * Sorunlar `c` içine eklenir; geri dönüş değeri soru kimliğidir (varsa).
 */
export function validateQuestion(raw: unknown, path: string, c: IssueCollector, ctx: Context): string | undefined {
  if (!c.isObject(raw, path)) return undefined;
  const q = raw;

  c.string(q, "id", path);
  c.oneOf(q, "type", QUESTION_TYPES, path);
  c.oneOf(q, "difficulty", [1, 2, 3], path);
  c.string(q, "prompt", path);
  c.string(q, "hint", path, { optional: true });
  c.string(q, "explanation", path);
  c.stringArray(q, "tags", path);
  c.stringArray(q, "errorTags", path).forEach((tag, i) => {
    if (!(ERROR_TAGS as readonly string[]).includes(tag)) c.add(`${path}.errorTags[${i}]`, `bilinmeyen hata etiketi: ${tag}`);
  });
  if (q.lessonId !== ctx.lessonId) c.add(`${path}.lessonId`, `"${ctx.lessonId}" olmalı`);
  if (q.levelId !== ctx.levelId) c.add(`${path}.levelId`, `"${ctx.levelId}" olmalı`);

  switch (q.type) {
    case "multiple_choice":
      validateMultipleChoice(q, path, c);
      break;
    case "fill_blank":
      if (typeof q.prompt === "string" && q.prompt.split(BLANK).length !== 2) {
        c.add(`${path}.prompt`, `tam olarak bir "${BLANK}" boşluğu içermeli`);
      }
      validateAnswerList(q, path, c);
      validateFeedback(q, path, c);
      break;
    case "sentence_building":
      validateSentenceBuilding(q, path, c);
      break;
    case "error_correction": {
      c.string(q, "incorrectSentence", path);
      const answers = validateAnswerList(q, path, c);
      if (typeof q.incorrectSentence === "string") {
        const wrong = normalizeAnswer(q.incorrectSentence);
        if (answers.some((a) => normalizeAnswer(a) === wrong)) {
          c.add(`${path}.answers`, "düzeltilmiş cevap hatalı cümleyle aynı olamaz");
        }
        if (typeof q.errorSpan === "string" && !q.incorrectSentence.includes(q.errorSpan)) {
          c.add(`${path}.errorSpan`, "hatalı cümlenin içinde geçmeli");
        }
      }
      validateFeedback(q, path, c);
      break;
    }
    case "translation":
      c.string(q, "source", path);
      c.string(q, "targetStructure", path);
      validateAnswerList(q, path, c);
      validateFeedback(q, path, c);
      break;
  }
  return typeof q.id === "string" ? q.id : undefined;
}

function validateMultipleChoice(q: Record<string, unknown>, path: string, c: IssueCollector) {
  c.string(q, "sentence", path, { optional: true });
  const options = c.array(q, "options", path, { nonEmpty: true });
  const ids: string[] = [];
  const texts = new Set<string>();
  options.forEach((o, i) => {
    const p = `${path}.options[${i}]`;
    if (!c.isObject(o, p)) return;
    c.string(o, "id", p);
    c.string(o, "text", p);
    if (typeof o.id === "string") {
      if (ids.includes(o.id)) c.add(p, `yinelenen seçenek kimliği: ${o.id}`);
      ids.push(o.id);
    }
    if (typeof o.text === "string") {
      const t = normalizeAnswer(o.text);
      if (texts.has(t)) c.add(p, `yinelenen seçenek metni: ${o.text}`);
      texts.add(t);
    }
  });
  if (options.length < 2) c.add(`${path}.options`, "en az 2 seçenek olmalı");
  if (typeof q.correctOptionId !== "string" || !ids.includes(q.correctOptionId)) {
    c.add(`${path}.correctOptionId`, "seçeneklerden birine ait olmalı");
  }
  if (c.isObject(q.optionExplanations, `${path}.optionExplanations`)) {
    const expl = q.optionExplanations;
    for (const id of ids) {
      if (id === q.correctOptionId) continue;
      if (typeof expl[id] !== "string" || (expl[id] as string).trim() === "") {
        c.add(`${path}.optionExplanations.${id}`, "her yanlış seçenek için açıklama gerekli");
      }
    }
    for (const key of Object.keys(expl)) {
      if (!ids.includes(key)) c.add(`${path}.optionExplanations.${key}`, "olmayan seçeneğe ait");
    }
  }
}

/** Cevap listesinin boş olmadığını ve normalize hâlde yinelenmediğini denetler. */
function validateAnswerList(q: Record<string, unknown>, path: string, c: IssueCollector): string[] {
  const answers = c.stringArray(q, "answers", path, { nonEmpty: true });
  const seen = new Set<string>();
  answers.forEach((a, i) => {
    const n = normalizeAnswer(a);
    if (seen.has(n)) c.add(`${path}.answers[${i}]`, `normalize edildiğinde yinelenen cevap: ${a}`);
    seen.add(n);
  });
  return answers;
}

function validateFeedback(q: Record<string, unknown>, path: string, c: IssueCollector) {
  const list = c.array(q, "wrongAnswerFeedback", path, { optional: true });
  const accepted = Array.isArray(q.answers)
    ? new Set(q.answers.filter((a): a is string => typeof a === "string").map(normalizeAnswer))
    : new Set<string>();
  list.forEach((f, i) => {
    const p = `${path}.wrongAnswerFeedback[${i}]`;
    if (!c.isObject(f, p)) return;
    c.string(f, "answer", p);
    c.string(f, "explanation", p);
    if (typeof f.answer === "string" && accepted.has(normalizeAnswer(f.answer))) {
      c.add(p, "kabul edilen bir cevap yanlış cevap geri bildirimi olamaz");
    }
  });
}

function validateSentenceBuilding(q: Record<string, unknown>, path: string, c: IssueCollector) {
  c.oneOf(q, "endPunctuation", [".", "?", "!"], path);
  const answer = c.stringArray(q, "answer", path, { nonEmpty: true });
  if (answer.length < 3) c.add(`${path}.answer`, "en az 3 parça olmalı");
  const distractors = c.stringArray(q, "distractors", path, { optional: true });
  const sortedAnswer = [...answer].sort().join("|");
  c.array(q, "alternativeAnswers", path, { optional: true }).forEach((alt, i) => {
    const p = `${path}.alternativeAnswers[${i}]`;
    if (!Array.isArray(alt) || alt.some((t) => typeof t !== "string")) {
      c.add(p, "metin dizisi olmalı");
      return;
    }
    if ([...alt].sort().join("|") !== sortedAnswer) c.add(p, "doğru cevapla aynı parçalardan oluşmalı");
    if (alt.join(" ") === answer.join(" ")) c.add(p, "doğru cevabın aynısı olamaz");
  });
  for (const d of distractors) {
    if (answer.includes(d)) c.add(`${path}.distractors`, `çeldirici cevapta da geçiyor: ${d}`);
  }
}
