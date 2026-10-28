import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ProgressBar, Screen } from "@/components/common";
import { QuestionCard } from "@/components/exercise";
import { PRACTICE_COMPLETION_MIN_ANSWERED_RATIO } from "@/constants/progress";
import { getLessonContent } from "@/data/contentRepository";
import type { Question } from "@/domain/models";
import { isResponseComplete, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { spacing } from "@/theme";

type Outcome = "correct" | "wrong" | "skipped";

export default function PracticeScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const { preferences } = useUserState();

  const [sessionId] = useState(() => progressService.newSessionId());
  const [queue, setQueue] = useState<Question[]>(lesson?.exercises ?? []);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [finished, setFinished] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!lesson) {
    return (
      <Screen>
        <Card><AppText variant="heading">Alıştırmalar bulunamadı</AppText></Card>
      </Screen>
    );
  }

  const total = lesson.exercises.length;
  const question = queue[index];

  const finish = (latest: Record<string, Outcome>) => {
    const answered = Object.values(latest).filter((o) => o !== "skipped").length;
    setCompleted(progressService.finishPractice(lessonId, answered, total));
    setFinished(true);
  };

  const advance = (latest: Record<string, Outcome>) => {
    setResponse(null);
    setEvaluation(null);
    if (index + 1 < queue.length) setIndex(index + 1);
    else finish(latest);
  };

  const check = () => {
    if (!question || evaluation || !isResponseComplete(response)) return;
    const result = progressService.submitAnswer(question, response, { sessionId, mode: "practice" });
    setEvaluation(result);
    setOutcomes((o) => ({ ...o, [question.id]: result.isCorrect ? "correct" : "wrong" }));
  };

  const skip = () => {
    if (!question || evaluation) return;
    // Atlanan soru yanlış cevap olarak kaydedilmez.
    const next = { ...outcomes, [question.id]: "skipped" as Outcome };
    setOutcomes(next);
    advance(next);
  };

  const restartWith = (ids: Outcome) => {
    const retry = lesson.exercises.filter((q) => outcomes[q.id] === ids);
    setQueue(retry);
    setIndex(0);
    setRound((r) => r + 1);
    setResponse(null);
    setEvaluation(null);
    setFinished(false);
  };

  if (finished) {
    const counts = { correct: 0, wrong: 0, skipped: 0 };
    for (const q of lesson.exercises) {
      const o = outcomes[q.id];
      if (o) counts[o]++;
    }
    const answered = counts.correct + counts.wrong;
    return (
      <Screen
        footer={
          <>
            <Button title="Konu sonu sınavına geç" onPress={() => router.replace({ pathname: "/exam/[lessonId]", params: { lessonId } })} />
            <Button title="Derse dön" variant="ghost" onPress={() => router.back()} />
          </>
        }
      >
        <Stack.Screen options={{ title: "Alıştırma sonucu" }} />
        <AppText variant="title" accessibilityRole="header">Alıştırma turu bitti</AppText>
        <Card>
          <AppText variant="subheading">Sonuç</AppText>
          <AppText>Doğru: {counts.correct}</AppText>
          <AppText>Yanlış: {counts.wrong}</AppText>
          <AppText>Atlanan: {counts.skipped}</AppText>
          {answered > 0 ? (
            <>
              <ProgressBar value={counts.correct / answered} color="#55C995" accessibilityLabel="Doğruluk oranı" />
              <AppText variant="caption" color="textSecondary">Cevapladığın soruların %{Math.round((counts.correct / answered) * 100)}’i doğru.</AppText>
            </>
          ) : null}
        </Card>
        <Card>
          <AppText variant="subheading">{completed ? "Alıştırmalar tamamlandı" : "Alıştırmalar henüz tamamlanmadı"}</AppText>
          <AppText color="textSecondary">
            {completed
              ? "Bu ders için alıştırma adımını bitirdin. Dilediğin zaman yeniden çözebilirsin."
              : `Alıştırmaları tamamlamak için soruların en az %${Math.round(PRACTICE_COMPLETION_MIN_ANSWERED_RATIO * 100)}’ini cevaplamalısın. Atladığın soruları aşağıdan çözebilirsin.`}
          </AppText>
        </Card>
        {counts.skipped > 0 ? <Button title={`Atlanan ${counts.skipped} soruyu çöz`} variant="secondary" onPress={() => restartWith("skipped")} /> : null}
        {counts.wrong > 0 ? <Button title={`Yanlış yaptığım ${counts.wrong} soruyu tekrar çöz`} variant="secondary" onPress={() => restartWith("wrong")} /> : null}
      </Screen>
    );
  }

  const progress = (index + (evaluation ? 1 : 0)) / queue.length;
  const isLast = index + 1 === queue.length;

  return (
    <Screen
      footer={
        evaluation ? (
          <Button title={isLast ? "Bitir" : "Sonraki soru"} onPress={() => advance(outcomes)} />
        ) : (
          <View style={styles.row}>
            <View style={styles.third}><Button title="Atla" variant="secondary" onPress={skip} /></View>
            <View style={styles.twoThirds}><Button title="Cevabı kontrol et" disabled={!isResponseComplete(response)} onPress={check} /></View>
          </View>
        )
      }
    >
      <Stack.Screen options={{ title: "Alıştırma" }} />
      <View style={styles.progress}>
        <AppText variant="caption" color="textSecondary">Soru {index + 1} / {queue.length}</AppText>
        <ProgressBar value={progress} accessibilityLabel={`Soru ${index + 1} / ${queue.length}`} />
      </View>
      <QuestionCard
        key={`${round}-${question.id}`}
        question={question}
        response={response}
        onChange={setResponse}
        evaluation={evaluation}
        showHint={preferences.showHints}
        onSubmit={check}
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
