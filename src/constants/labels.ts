import type { ErrorTag, MasteryBand, QuestionType } from "@/domain/models";

export const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Çoktan seçmeli",
  fill_blank: "Boşluk doldurma",
  sentence_building: "Cümle kurma",
  error_correction: "Hata düzeltme",
  translation: "Çeviri",
};

export const errorTagLabels: Record<ErrorTag, string> = {
  auxiliary_verb: "Yardımcı fiil",
  tense_confusion: "Zaman karışıklığı",
  subject_verb_agreement: "Özne–fiil uyumu",
  word_order: "Sözcük sırası",
  article_usage: "Tanımlık (a / an / the)",
  preposition_usage: "Edat kullanımı",
  verb_form: "Fiil biçimi",
  negation: "Olumsuzluk",
  question_form: "Soru yapısı",
  pronoun_usage: "Zamir kullanımı",
  plural_form: "Çoğul biçimi",
  modal_usage: "Modal fiil",
  conditional_form: "Koşul yapısı",
  passive_form: "Edilgen yapı",
  time_expression: "Zaman ifadesi",
};

export const masteryBandLabels: Record<MasteryBand, string> = {
  not_enough_data: "Yeterli veri yok",
  needs_work: "Geliştirilmeli",
  beginner: "Başlangıç",
  good: "İyi",
  strong: "Güçlü",
};
