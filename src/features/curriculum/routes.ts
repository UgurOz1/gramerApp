import type { Href } from "expo-router";

import { getLessonSummary } from "./catalog";

/** Müfredat kaydını doğru ekrana götürür: karşılaştırmalar kendi ekranına, dersler ders ekranına. */
export function lessonHref(lessonId: string): Href {
  if (getLessonSummary(lessonId)?.kind === "comparison") {
    return { pathname: "/comparisons/[comparisonId]", params: { comparisonId: lessonId } };
  }
  return { pathname: "/lesson/[lessonId]", params: { lessonId } };
}
