import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/common";
import { PracticeRunner } from "@/components/exercise";
import { getQuestionById } from "@/data/contentRepository";
import type { Question } from "@/domain/models";
import { buildMistakeItems, unresolvedItems } from "@/features/mistakes/viewModel";
import { userStore } from "@/services/progress/userStore";

/** Yanlış sorularını tekrar çözme turu. Başlangıçtaki yanlışlar sabitlenir; çözdükçe liste değişse de tur bozulmaz. */
export default function MistakesPracticeScreen() {
  const { scope, questionId } = useLocalSearchParams<{ scope?: string; questionId?: string }>();
  const [questions] = useState<Question[]>(() => {
    if (scope === "question" && questionId) {
      const q = getQuestionById(questionId);
      return q ? [q] : [];
    }
    return unresolvedItems(buildMistakeItems(userStore.getState().mistakes, getQuestionById)).map((i) => i.question);
  });

  return (
    <>
      <Stack.Screen options={{ title: "Yanlışları tekrar çöz" }} />
      <PracticeRunner
        questions={questions}
        mode="mistakes"
        summaryActions={
          <>
            <Button title="Yanlışlarıma dön" onPress={() => router.back()} />
            <Button title="Ana sayfaya dön" variant="ghost" onPress={() => router.dismissTo("/")} />
          </>
        }
      />
    </>
  );
}
