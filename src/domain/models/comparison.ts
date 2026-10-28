import type { ExampleSentence } from "./lesson";
import type { Question } from "./question";

export type ComparedStructure = {
  name: string;
  meaning: string;
  usage: string[];
  structure: string;
};

export type Comparison = {
  id: string;
  title: string;
  /** Bağlantılı dersler. */
  lessonIds: string[];
  structures: ComparedStructure[];
  /** Yan yana örnek çiftleri. */
  pairs: { left: ExampleSentence; right: ExampleSentence; note: string }[];
  meaningDifference: string[];
  confusions: { wrong: string; right: string; explanation: string }[];
  quiz: Question[];
};

export type ComparisonsFile = {
  schemaVersion: number;
  comparisons: Comparison[];
};
