import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, PageHero, Screen, icons } from "@/components/common";
import { questionTypeLabels } from "@/constants/labels";
import type { AnswerMode, ExamResult, Question } from "@/domain/models";
import { isResponseComplete, type AnswerResponse } from "@/domain/question-engine/evaluate";
import type { ExamResponses } from "@/domain/scoring/examScoring";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { colors, radius, spacing } from "@/theme";

import { QuestionCard } from "./QuestionCard";
import { RunProgress } from "./RunProgress";

type Props = {
  examId: string;
  title: string;
  description: string;
  passPercent: number;
  lessonId: string | null;
  kind: ExamResult["kind"];
  /** Cevap geçmişine yazılacak mod. */
  attemptMode?: AnswerMode;
  questions: Question[];
  /** Başlangıç ekranında gösterilecek kapsam satırları. */
  scopeLines: string[];
  onSubmitted: (result: ExamResult) => void;
};

/**
 * Sınav akışı: giriş → sorular (doğru cevap gösterilmez) → bitiş.
 * Cevaplar yalnızca sınav bitince tek seferde puanlanır ve kaydedilir.
 */
export function ExamRunner(props: Props) {
  const { questions } = props;
  const { preferences } = useUserState();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const responses = useRef<ExamResponses>({});
  const startedAt = useRef(0);
  const [sessionId] = useState(() => progressService.newSessionId());

  if (!started) {
    const typeCounts = questions.reduce<Record<string, number>>((acc, q) => ((acc[q.type] = (acc[q.type] ?? 0) + 1), acc), {});
    return (
      <Screen
        footer={
          <Button
            title="Sınava başla"
            icon={icons.play}
            size="lg"
            disabled={questions.length === 0}
            onPress={() => {
              startedAt.current = Date.now();
              setStarted(true);
            }}
          />
        }
      >
        <PageHero emoji="📝" title={props.title} subtitle={props.description} gradient="linear-gradient(150deg, #3B2F9E 0%, #141829 80%)">
          <View style={styles.facts}>
            <Fact value={String(questions.length)} label="soru" />
            <Fact value={`%${props.passPercent}`} label="başarı sınırı" />
            <Fact value="∞" label="süre" />
          </View>
        </PageHero>
        {props.scopeLines.length > 0 ? (
          <Card>
            <AppText variant="label" color="accent">KAPSAM</AppText>
            {props.scopeLines.map((line) => <AppText key={line} color="textSecondary">{line}</AppText>)}
          </Card>
        ) : null}
        <Card>
          <AppText variant="label" color="accent">SORU TÜRLERİ</AppText>
          <View style={styles.types}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge key={type} label={`${questionTypeLabels[type as keyof typeof questionTypeLabels]} · ${count}`} tone="accent" />
            ))}
          </View>
        </Card>
        <Card>
          <AppText variant="label" color="accent">NASIL İŞLER?</AppText>
          <Rule emoji="🙈" text="Doğru cevaplar sınav bitene kadar gösterilmez." />
          <Rule emoji="⏳" text="Süre sınırı yok, acele etme." />
          <Rule emoji="⏭️" text="Emin olmadığın soruyu atlayabilirsin; atlanan soru yanlış sayılmaz ama puan getirmez." />
          <Rule emoji="➡️" text="Bir soruyu geçtikten sonra geri dönemezsin." />
        </Card>
      </Screen>
    );
  }

  const question = questions[index];
  const isLast = index + 1 === questions.length;

  const next = (answer: AnswerResponse | null) => {
    responses.current[question.id] = answer;
    setResponse(null);
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    props.onSubmitted(
      progressService.submitExam({
        examId: props.examId,
        lessonId: props.lessonId,
        kind: props.kind,
        attemptMode: props.attemptMode,
        questions,
        responses: responses.current,
        startedAt: startedAt.current,
        sessionId,
      }),
    );
  };

  return (
    <Screen
      footer={
        <View style={styles.row}>
          <View style={styles.third}><Button title="Atla" variant="secondary" onPress={() => next(null)} /></View>
          <View style={styles.twoThirds}>
            <Button title={isLast ? "Sınavı bitir" : "Sonraki soru"} icon={isLast ? icons.trophy : icons.arrowRight} disabled={!isResponseComplete(response)} onPress={() => next(response)} />
          </View>
        </View>
      }
    >
      <View style={styles.examTag}>
        <AppText variant="caption" color="warning">📝 Sınav modu · cevaplar sonda gösterilir</AppText>
      </View>
      <RunProgress current={index + 1} total={questions.length} value={index / questions.length} />
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

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </View>
  );
}

function Rule({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.rule}>
      <AppText style={styles.ruleEmoji}>{emoji}</AppText>
      <AppText color="textSecondary" style={styles.flex}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  facts: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  fact: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: "rgba(10,12,22,0.45)" },
  types: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  rule: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  ruleEmoji: { fontSize: 18, lineHeight: 24 },
  examTag: { alignSelf: "flex-start", paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.warningMuted },
  row: { flexDirection: "row", gap: spacing.sm },
  third: { flex: 1 },
  twoThirds: { flex: 2 },
});
