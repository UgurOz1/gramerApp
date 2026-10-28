import { Stack, router, useLocalSearchParams } from "expo-router";

import { AppText, Button, Card, Screen } from "@/components/common";
import { PracticeRunner } from "@/components/exercise";
import { PRACTICE_COMPLETION_MIN_ANSWERED_RATIO } from "@/constants/progress";
import { getComparison, getLessonContent } from "@/data/contentRepository";
import { progressService } from "@/services/progress/progressService";

export default function PracticeScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const comparison = lesson ? null : getComparison(lessonId);

  if (comparison) {
    return (
      <>
        <Stack.Screen options={{ title: "Mini test" }} />
        <PracticeRunner
          questions={comparison.quiz}
          mode="comparison"
          onFinish={({ answered, total }) => {
            const completed = progressService.finishPractice(lessonId, answered, total);
            return {
              title: completed ? "Mini test tamamlandı" : "Mini test henüz tamamlanmadı",
              text: completed
                ? "Bu karşılaştırmayı bitirdin. Hangisini seçeceğini karıştırdığında karşılaştırma sayfasına dönüp tekrar bakabilirsin."
                : `Mini testi tamamlamak için soruların en az %${Math.round(PRACTICE_COMPLETION_MIN_ANSWERED_RATIO * 100)}’ini cevaplamalısın.`,
            };
          }}
          summaryActions={
            <>
              <Button title="Karşılaştırmaya dön" onPress={() => router.back()} />
              <Button title="Tüm karşılaştırmalar" variant="ghost" onPress={() => router.replace("/comparisons")} />
            </>
          }
        />
      </>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <Card><AppText variant="heading">Alıştırmalar bulunamadı</AppText></Card>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Alıştırma" }} />
      <PracticeRunner
        questions={lesson.exercises}
        mode="practice"
        onFinish={({ answered, total }) => {
          const completed = progressService.finishPractice(lessonId, answered, total);
          return {
            title: completed ? "Alıştırmalar tamamlandı" : "Alıştırmalar henüz tamamlanmadı",
            text: completed
              ? "Bu ders için alıştırma adımını bitirdin. Dilediğin zaman yeniden çözebilirsin."
              : `Alıştırmaları tamamlamak için soruların en az %${Math.round(PRACTICE_COMPLETION_MIN_ANSWERED_RATIO * 100)}’ini cevaplamalısın. Atladığın soruları aşağıdan çözebilirsin.`,
          };
        }}
        summaryActions={
          <>
            <Button title="Konu sonu sınavına geç" onPress={() => router.replace({ pathname: "/exam/[lessonId]", params: { lessonId } })} />
            <Button title="Derse dön" variant="ghost" onPress={() => router.back()} />
          </>
        }
      />
    </>
  );
}
