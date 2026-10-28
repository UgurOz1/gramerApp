import { Stack, router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ProgressBar, Screen } from "@/components/common";
import { QuestionCard } from "@/components/exercise";
import { questionTypeLabels } from "@/constants/labels";
import { getLessonContent } from "@/data/contentRepository";
import { isResponseComplete, type AnswerResponse } from "@/domain/question-engine/evaluate";
import type { ExamResponses } from "@/domain/scoring/examScoring";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { spacing } from "@/theme";

export default function ExamScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const { preferences } = useUserState();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const responses = useRef<ExamResponses>({});
  const startedAt = useRef(0);
  const [sessionId] = useState(() => progressService.newSessionId());

  if (!lesson) {
    return (
      <Screen>
        <Card><AppText variant="heading">Sınav bulunamadı</AppText></Card>
      </Screen>
    );
  }

  const { exam } = lesson;
  const questions = exam.questions;

  if (!started) {
    const typeCounts = questions.reduce<Record<string, number>>((acc, q) => ((acc[q.type] = (acc[q.type] ?? 0) + 1), acc), {});
    return (
      <Screen
        footer={
          <Button
            title="Sınava başla"
            onPress={() => {
              startedAt.current = Date.now();
              setStarted(true);
            }}
          />
        }
      >
        <Stack.Screen options={{ title: "Konu sonu sınavı" }} />
        <AppText variant="title" accessibilityRole="header">{exam.title}</AppText>
        <Card>
          <AppText variant="subheading">Sınav hakkında</AppText>
          <AppText>{exam.description}</AppText>
          <AppText>Soru sayısı: {questions.length}</AppText>
          <AppText>Kapsam: {lesson.title}</AppText>
          <AppText>Başarı sınırı: %{exam.passPercent}</AppText>
        </Card>
        <Card>
          <AppText variant="subheading">Soru türleri</AppText>
          {Object.entries(typeCounts).map(([type, count]) => (
            <AppText key={type} color="textSecondary">
              {questionTypeLabels[type as keyof typeof questionTypeLabels]}: {count}
            </AppText>
          ))}
        </Card>
        <Card>
          <AppText variant="subheading">Nasıl işler?</AppText>
          <AppText color="textSecondary">• Doğru cevaplar sınav bitene kadar gösterilmez.</AppText>
          <AppText color="textSecondary">• Süre sınırı yoktur.</AppText>
          <AppText color="textSecondary">• Emin olmadığın soruyu atlayabilirsin; atlanan soru yanlış sayılmaz ama puan getirmez.</AppText>
          <AppText color="textSecondary">• Bir soruyu geçtikten sonra geri dönemezsin.</AppText>
        </Card>
      </Screen>
    );
  }

  const question = questions[index];
  const isLast = index + 1 === questions.length;

  const finish = () => {
    const result = progressService.submitExam({
      examId: exam.id,
      lessonId,
      kind: "lesson",
      questions,
      responses: responses.current,
      startedAt: startedAt.current,
      sessionId,
    });
    router.replace({ pathname: "/exam/result", params: { resultId: result.resultId } });
  };

  const next = (answer: AnswerResponse | null) => {
    responses.current[question.id] = answer;
    setResponse(null);
    if (isLast) finish();
    else setIndex(index + 1);
  };

  return (
    <Screen
      footer={
        <View style={styles.row}>
          <View style={styles.third}><Button title="Atla" variant="secondary" onPress={() => next(null)} /></View>
          <View style={styles.twoThirds}>
            <Button
              title={isLast ? "Sınavı bitir" : "Sonraki soru"}
              disabled={!isResponseComplete(response)}
              onPress={() => next(response)}
            />
          </View>
        </View>
      }
    >
      <Stack.Screen options={{ title: "Sınav" }} />
      <View style={styles.progress}>
        <AppText variant="caption" color="textSecondary">Soru {index + 1} / {questions.length}</AppText>
        <ProgressBar value={index / questions.length} accessibilityLabel={`Soru ${index + 1} / ${questions.length}`} />
      </View>
      <QuestionCard
        key={question.id}
        question={question}
        response={response}
        onChange={setResponse}
        evaluation={null}
        showHint={preferences.showHints}
        onSubmit={() => isResponseComplete(response) && next(response)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  third: { flex: 1 },
  twoThirds: { flex: 2 },
});
