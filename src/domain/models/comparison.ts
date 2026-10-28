import type { LevelId } from "./curriculum";
import type { ExampleSentence } from "./lesson";
import type { Question } from "./question";

export type ComparedStructure = {
  /** Yapının adı (ör. "Present Simple"). */
  name: string;
  /** Temel anlamı, Türkçe. */
  meaning: string;
  /** Kullanım alanları. */
  usage: string[];
  /** Olumlu, olumsuz ve soru biçimleri. */
  forms: { label: string; pattern: string; example: string }[];
  /** Bu yapıya işaret eden ipucu sözcükler (ör. "every day", "now"). */
  signals: string[];
};

export type ComparisonPair = {
  left: ExampleSentence;
  right: ExampleSentence;
  /** İki cümle arasındaki farkı açıklayan not. */
  note: string;
};

/**
 * Birbirine benzeyen yapıları karşılaştıran içerik (assets/data/comparisons/<id>.json).
 * Kimlik, müfredattaki "comparison" türündeki dersin kimliğiyle aynıdır.
 * Mini test soruları bu kimliğe bağlıdır.
 */
export type Comparison = {
  schemaVersion: number;
  id: string;
  levelId: LevelId;
  title: string;
  objectives: string[];
  /** Karşılaştırmaya giriş. */
  intro: string[];
  /** Karşılaştırılan konuların ders kimlikleri. */
  lessonIds: string[];
  structures: ComparedStructure[];
  /** Yan yana örnek çiftleri. */
  pairs: ComparisonPair[];
  /** Türkçe anlam farkı. */
  meaningDifference: { heading: string; body: string }[];
  /** "Hangisini seçmeliyim?" karar rehberi. */
  decisionGuide: { question: string; answer: string }[];
  /** Sık karıştırılan durumlar. */
  confusions: { wrong: string; right: string; explanation: string }[];
  /** Karşılaştırmalı mini test. */
  quiz: Question[];
};
