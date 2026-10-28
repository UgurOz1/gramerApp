import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { AppText, Card, Screen } from "@/components/common";
import { ExamRunner } from "@/components/exercise";
import { DEFAULT_PASS_PERCENT } from "@/constants/mastery";
import { getAllQuestionsForLesson } from "@/data/contentRepository";
import { buildMixedTest } from "@/domain/mixed/buildMixedTest";
import { QUESTION_TYPES, type QuestionType } from "@/domain/models";
import { getLessonSummary } from "@/features/curriculum/catalog";

/** Karışık test. Aynı parametreler aynı testi üretir (tohum sayesinde). */
export default function MixedRunScreen() {
  const { lessons, types, count, seed } = useLocalSearchParams<{ lessons?: string; types?: string; count?: string; seed?: string }>();

  const lessonIds = useMemo(() => (lessons ? lessons.split(",").filter(Boolean) : []), [lessons]);
  const questions = useMemo(() => {
    const allowed = (types ? types.split(",") : []).filter((t): t is QuestionType => (QUESTION_TYPES as readonly string[]).includes(t));
    const pool = lessonIds.flatMap((id) => getAllQuestionsForLesson(id));
    return buildMixedTest(pool, { questionTypes: allowed, count: Math.max(1, Number(count) || 15), seed: seed ?? "0" });
  }, [lessonIds, types, count, seed]);

  if (questions.length === 0) {
    return (
      <Screen>
        <Card>
          <AppText variant="heading">Test oluşturulamadı</AppText>
          <AppText color="textSecondary">Seçtiğin kapsamda uygun soru bulunamadı. Geri dönüp kapsamı değiştir.</AppText>
        </Card>
      </Screen>
    );
  }

  const names = lessonIds.map((id) => getLessonSummary(id)?.title ?? id);
  return (
    <>
      <Stack.Screen options={{ title: "Karışık test" }} />
      <ExamRunner
        examId={`mixed-${seed ?? "0"}`}
        title="Karışık test"
        description="Seçtiğin konulardan karışık sorular. Her soruda hangi kuralın gerektiğini kendin düşün."
        passPercent={DEFAULT_PASS_PERCENT}
        lessonId={null}
        kind="mixed"
        attemptMode="mixed"
        questions={questions}
        scopeLines={[`Kapsam: ${names.length > 3 ? `${names.slice(0, 3).join(", ")} ve ${names.length - 3} konu daha` : names.join(", ")}`]}
        onSubmitted={(result) => router.replace({ pathname: "/exam/result", params: { resultId: result.resultId } })}
      />
    </>
  );
}
