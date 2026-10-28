import type { LevelId } from "./curriculum";

export const QUESTION_TYPES = [
  "multiple_choice",
  "fill_blank",
  "sentence_building",
  "error_correction",
  "translation",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** 1: kuralın doğrudan uygulanması, 2: doğru yapının seçilmesi, 3: yapıları ayırt etme / yeni bağlam. */
export type Difficulty = 1 | 2 | 3;

/** Hata analizi için kullanılan sabit hata etiketleri. */
export const ERROR_TAGS = [
  "auxiliary_verb",
  "tense_confusion",
  "subject_verb_agreement",
  "word_order",
  "article_usage",
  "preposition_usage",
  "verb_form",
  "negation",
  "question_form",
  "pronoun_usage",
  "plural_form",
  "modal_usage",
  "conditional_form",
  "passive_form",
  "time_expression",
] as const;
export type ErrorTag = (typeof ERROR_TAGS)[number];

/** Belirli bir yanlış cevaba özel geri bildirim (ör. "is not" → "Burada özne they…"). */
export type AnswerFeedback = {
  answer: string;
  explanation: string;
};

type QuestionBase = {
  id: string;
  lessonId: string;
  levelId: LevelId;
  difficulty: Difficulty;
  /** Soru metni. Boşluk doldurmada boşluk "___" ile gösterilir. */
  prompt: string;
  /** Türkçe ipucu. */
  hint?: string;
  /** Doğru cevabın neden doğru olduğunu anlatan açıklama. */
  explanation: string;
  /** Konu etiketleri (ör. "to-be", "negative"). */
  tags: string[];
  errorTags: ErrorTag[];
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice";
  /** Seçeneklerin bağlamı olan cümle (isteğe bağlı; prompt yönerge ise). */
  sentence?: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  /** Her yanlış seçenek için neden yanlış olduğu. */
  optionExplanations: Record<string, string>;
};

export type FillBlankQuestion = QuestionBase & {
  type: "fill_blank";
  /** Kabul edilen cevaplar; ilki gösterilecek doğru cevaptır (ör. ["doesn't", "does not"]). */
  answers: string[];
  wrongAnswerFeedback?: AnswerFeedback[];
};

export type SentenceBuildingQuestion = QuestionBase & {
  type: "sentence_building";
  /** Doğru sıradaki parçalar. */
  answer: string[];
  /** Kabul edilen diğer sıralamalar (ör. zarfın yerinin değişebildiği durumlar). */
  alternativeAnswers?: string[][];
  /** Cümlede yer almayan çeldirici parçalar. */
  distractors?: string[];
  /** Cümle sonu noktalaması; parça olarak seçilmez, sabit gösterilir. */
  endPunctuation: "." | "?" | "!";
};

export type ErrorCorrectionQuestion = QuestionBase & {
  type: "error_correction";
  /** Hatalı cümle. */
  incorrectSentence: string;
  /** Kabul edilen düzeltilmiş cümleler; ilki gösterilecek doğru cevaptır. */
  answers: string[];
  /** Hatalı kısım (vurgulamak için, isteğe bağlı). */
  errorSpan?: string;
  wrongAnswerFeedback?: AnswerFeedback[];
};

export type TranslationQuestion = QuestionBase & {
  type: "translation";
  /** Çevrilecek Türkçe cümle. */
  source: string;
  /** Kabul edilen İngilizce çeviriler; ilki örnek cevaptır. */
  answers: string[];
  /** Sorunun ölçtüğü gramer kuralı (ör. "Present Simple olumsuz: doesn't + V1"). */
  targetStructure: string;
  wrongAnswerFeedback?: AnswerFeedback[];
};

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | SentenceBuildingQuestion
  | ErrorCorrectionQuestion
  | TranslationQuestion;
