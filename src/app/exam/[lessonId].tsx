import { Stack, router, useLocalSearchParams } from "expo-router";

import { AppText, Card, Screen } from "@/components/common";
import { ExamRunner } from "@/components/exercise";
import { getLessonContent } from "@/data/contentRepository";

export default function ExamScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);

  if (!lesson) {
    return (
      <Screen>
        <Card><AppText variant="heading">Sınav bulunamadı</AppText></Card>
      </Screen>
    );
  }

  const { exam } = lesson;
  return (
    <>
      <Stack.Screen options={{ title: "Konu sonu sınavı" }} />
      <ExamRunner
        examId={exam.id}
        title={exam.title}
        description={exam.description}
        passPercent={exam.passPercent}
        lessonId={lessonId}
        kind="lesson"
        questions={exam.questions}
        scopeLines={[`Kapsam: ${lesson.title}`]}
        onSubmitted={(result) => router.replace({ pathname: "/exam/result", params: { resultId: result.resultId } })}
      />
    </>
  );
}
