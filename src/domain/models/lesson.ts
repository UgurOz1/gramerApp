import type { LevelId } from "./curriculum";
import type { Question } from "./question";

export type ExampleSentence = {
  id: string;
  en: string;
  tr: string;
  /** Kuralın bu örnekte nasıl işlediğine dair kısa not. */
  note?: string;
  /** Cümlede vurgulanacak kısım (ör. "is"). */
  highlight?: string;
};

export type Formula = {
  label: string;
  /** Ör. "Özne + am/is/are + …" */
  pattern: string;
  exampleIds?: string[];
};

export type LessonSection =
  | { id: string; type: "intro"; title: string; paragraphs: string[] }
  | { id: string; type: "rule"; title: string; paragraphs: string[]; formulas?: Formula[] }
  | {
      id: string;
      type: "forms";
      title: string;
      paragraphs?: string[];
      /** Olumlu / olumsuz / soru gibi biçimler. */
      forms: { label: string; formula: string; exampleIds: string[]; note?: string }[];
    }
  | { id: string; type: "examples"; title: string; paragraphs?: string[]; exampleIds: string[] }
  | {
      id: string;
      type: "usage";
      title: string;
      paragraphs?: string[];
      items: { heading: string; body: string; exampleIds?: string[] }[];
    }
  | {
      id: string;
      type: "mistakes";
      title: string;
      items: { wrong: string; right: string; explanation: string }[];
    }
  | {
      id: string;
      type: "confusions";
      title: string;
      items: { topic: string; body: string; lessonId?: string; comparisonId?: string }[];
    }
  | { id: string; type: "notes"; title: string; tone: "info" | "warning"; items: string[] }
  /** Kısa anlama kontrolü: ders içinde çözülen birkaç soru. */
  | { id: string; type: "check"; title: string; questionIds: string[] };

export type LessonSectionType = LessonSection["type"];

export type Exam = {
  id: string;
  title: string;
  description: string;
  /** Başarı sınırı (yüzde). */
  passPercent: number;
  questions: Question[];
};

/** Tek bir ders dosyasının (assets/data/levels/<seviye>/<ders>.json) içeriği. */
export type LessonContent = {
  schemaVersion: number;
  id: string;
  levelId: LevelId;
  title: string;
  objectives: string[];
  sections: LessonSection[];
  examples: ExampleSentence[];
  /** Alıştırma soruları (ders içi kontrol soruları dâhil). */
  exercises: Question[];
  exam: Exam;
};
