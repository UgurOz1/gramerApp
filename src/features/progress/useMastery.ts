import { useMemo } from "react";

import { getAvailableComparisonIds, getAvailableLessonIds, getComparison, getLessonContent } from "@/data/contentRepository";
import type { Comparison, LessonContent, TopicMastery } from "@/domain/models";
import { useUserState } from "@/services/progress/userStore";

import { computeAllMastery } from "./summary";

/** İçeriği hazır tüm derslerin ustalığı; cevap geçmişi değiştikçe yeniden hesaplanır. */
export function useMastery(): Record<string, TopicMastery> {
  const { attempts, examResults } = useUserState();
  return useMemo(() => {
    const lessons = getAvailableLessonIds()
      .map((id) => getLessonContent(id))
      .filter((l): l is LessonContent => !!l);
    const comparisons = getAvailableComparisonIds()
      .map((id) => getComparison(id))
      .filter((c): c is Comparison => !!c);
    return computeAllMastery({ attempts, examResults }, lessons, comparisons);
  }, [attempts, examResults]);
}
