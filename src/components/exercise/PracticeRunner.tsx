import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ProgressBar, Screen } from "@/components/common";
import type { AnswerMode, Question } from "@/domain/models";
import { isResponseComplete, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";

import { QuestionCard } from "./QuestionCard";

type Outcome = "correct" | "wrong" | "skipped";

type Props = {
  questions: Question[];
  mode: AnswerMode;
  /** Tur bitince çağrılır; özet ekranında gösterilecek bir not döndürebilir. */
  onFinish?: (stats: { answered: number; total: number }) => { title: string; text: string } | void;
  /** Özet ekranının altındaki sabit butonlar. */
  summaryActions: ReactNode;
};

/**
 * Anında geri bildirimli soru turu: cevapla → kontrol et → açıklamayı gör → sonraki.
 * Atlanan soru yanlış sayılmaz. Tur sonunda atlananlar ve yanlışlar yeniden çözülebilir.
 */
export function PracticeRunner({ questions, mode, onFinish, summaryActions }: Props) {
  const { preferences } = useUserState();
  const [sessionId] = useState(() => progressService.newSessionId());
  const [queue, setQueue] = useState<Question[]>(questions);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [finished, setFinished] = useState(false);
  const [note, setNote] = useState<{ title: string; text: string } | null>(null);

  const total = questions.length;
  const question = queue[index];

  const finish = (latest: Record<string, Outcome>) => {
    const answered = Object.values(latest).filter((o) => o !== "skipped").length;
    setNote(onFinish?.({ answered, total }) ?? null);
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
    const result = progressService.submitAnswer(question, response, { sessionId, mode });
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

  const restartWith = (which: Outcome) => {
    setQueue(questions.filter((q) => outcomes[q.id] === which));
    setIndex(0);
    setRound((r) => r + 1);
    setResponse(null);
    setEvaluation(null);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <Screen footer={summaryActions}>
        <Card><AppText variant="heading">Çözülecek soru yok</AppText></Card>
      </Screen>
    );
  }

  if (finished) {
    const counts = { correct: 0, wrong: 0, skipped: 0 };
    for (const q of questions) {
      const o = outcomes[q.id];
      if (o) counts[o]++;
    }
    const answered = counts.correct + counts.wrong;
    return (
      <Screen footer={summaryActions}>
        <AppText variant="title" accessibilityRole="header">Tur bitti</AppText>
        <Card>
          <AppText variant="subheading">Sonuç</AppText>
          <AppText>Doğru: {counts.correct}</AppText>
          <AppText>Yanlış: {counts.wrong}</AppText>
          <AppText>Atlanan: {counts.skipped}</AppText>
          {answered > 0 ? (
            <>
              <ProgressBar value={counts.correct / answered} color={colors.success} accessibilityLabel="Doğruluk oranı" />
              <AppText variant="caption" color="textSecondary">Cevapladığın soruların %{Math.round((counts.correct / answered) * 100)}’i doğru.</AppText>
            </>
          ) : null}
        </Card>
        {note ? (
          <Card>
            <AppText variant="subheading">{note.title}</AppText>
            <AppText color="textSecondary">{note.text}</AppText>
          </Card>
        ) : null}
        {counts.skipped > 0 ? <Button title={`Atlanan ${counts.skipped} soruyu çöz`} variant="secondary" onPress={() => restartWith("skipped")} /> : null}
        {counts.wrong > 0 ? <Button title={`Yanlış yaptığım ${counts.wrong} soruyu tekrar çöz`} variant="secondary" onPress={() => restartWith("wrong")} /> : null}
      </Screen>
    );
  }

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
      <View style={styles.progress}>
        <AppText variant="caption" color="textSecondary">Soru {index + 1} / {queue.length}</AppText>
        <ProgressBar value={(index + (evaluation ? 1 : 0)) / queue.length} accessibilityLabel={`Soru ${index + 1} / ${queue.length}`} />
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
