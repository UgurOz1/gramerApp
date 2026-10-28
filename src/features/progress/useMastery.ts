import { useMemo } from "react";

import { getAvailableLessonIds, getLessonContent } from "@/data/contentRepository";
import type { LessonContent, TopicMastery } from "@/domain/models";
import { useUserState } from "@/services/progress/userStore";

import { computeAllMastery } from "./summary";

/** İçeriği hazır tüm derslerin ustalığı; cevap geçmişi değiştikçe yeniden hesaplanır. */
export function useMastery(): Record<string, TopicMastery> {
  const { attempts, examResults } = useUserState();
  return useMemo(() => {
    const lessons = getAvailableLessonIds()
      .map((id) => getLessonContent(id))
      .filter((l): l is LessonContent => !!l);
    return computeAllMastery({ attempts, examResults }, lessons);
  }, [attempts, examResults]);
}
