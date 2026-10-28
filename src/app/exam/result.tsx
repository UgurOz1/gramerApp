import { Stack, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, ProgressBar, Screen } from "@/components/common";
import { errorTagLabels, questionTypeLabels } from "@/constants/labels";
import { getLessonContent } from "@/data/contentRepository";
import { describeCorrectAnswer, findAnswerFeedback } from "@/domain/question-engine/evaluate";
import type { Question } from "@/domain/models";
import { breakdownByType } from "@/domain/scoring/examScoring";
import { useUserState } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";

function questionText(q: Question): string {
  switch (q.type) {
    case "error_correction":
      return `Hatalı cümle: ${q.incorrectSentence}`;
    case "translation":
      return q.source;
    case "sentence_building":
      return q.hint ?? q.prompt;
    default:
      return q.prompt;
  }
}

export default function ExamResultScreen() {
  const { resultId } = useLocalSearchParams<{ resultId: string }>();
  const { examResults } = useUserState();
  const result = examResults.find((r) => r.resultId === resultId);
  const lesson = result?.lessonId ? getLessonContent(result.lessonId) : null;

  if (!result || !lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Sınav sonucu" }} />
        <Card>
          <AppText variant="heading">Sonuç bulunamadı</AppText>
          <AppText color="textSecondary">Bu sınav sonucu kayıtlı değil.</AppText>
        </Card>
        <Button title="Ana sayfaya dön" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  const passed = result.percent >= lesson.exam.passPercent;
  const byType = breakdownByType(result.questionResults);
  const byId = new Map(lesson.exam.questions.map((q) => [q.id, q]));
  const missed = result.questionResults.filter((r) => r.isCorrect !== true);
  const wrongOnly = result.questionResults.filter((r) => r.isCorrect === false);

  // Yanlış yapılan soruların hata etiketleri → "Hata türleri"
  const tagCounts = new Map<string, number>();
  for (const r of wrongOnly) {
    for (const tag of byId.get(r.questionId)?.errorTags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <Screen
      footer={
        <>
          <Button title="Sınavı yeniden çöz" onPress={() => router.replace({ pathname: "/exam/[lessonId]", params: { lessonId: lesson.id } })} />
          <Button title="Dersi tekrar aç" variant="secondary" onPress={() => router.replace({ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } })} />
          <Button title="Ana sayfaya dön" variant="ghost" onPress={() => router.dismissAll()} />
        </>
      }
    >
      <Stack.Screen options={{ title: "Sınav sonucu", headerBackVisible: false }} />

      <Card>
        <Badge label={passed ? "BAŞARILI" : "TEKRAR ÖNERİLİR"} tone={passed ? "success" : "warning"} />
        <AppText variant="title" accessibilityRole="header">%{result.percent}</AppText>
        <ProgressBar value={result.percent / 100} color={passed ? colors.success : colors.warning} accessibilityLabel={`Başarı yüzdesi ${result.percent}`} />
        <AppText color="textSecondary">{lesson.exam.title} · başarı sınırı %{lesson.exam.passPercent}</AppText>
      </Card>

      <View style={styles.stats}>
        <Card style={styles.stat}><AppText variant="title" color="success">{result.correct}</AppText><AppText variant="caption" color="textSecondary">Doğru</AppText></Card>
        <Card style={styles.stat}><AppText variant="title" color="danger">{result.wrong}</AppText><AppText variant="caption" color="textSecondary">Yanlış</AppText></Card>
        <Card style={styles.stat}><AppText variant="title" color="textSecondary">{result.skipped}</AppText><AppText variant="caption" color="textSecondary">Atlanan</AppText></Card>
      </View>

      <Card>
        <AppText variant="subheading">Soru türüne göre performans</AppText>
        {Object.entries(byType).map(([type, v]) => (
          <View key={type} style={styles.typeRow}>
            <View style={styles.typeHead}>
              <AppText>{questionTypeLabels[type as keyof typeof questionTypeLabels]}</AppText>
              <AppText color="textSecondary">{v.correct} / {v.total}</AppText>
            </View>
            <ProgressBar value={v.total ? v.correct / v.total : 0} color={colors.success} accessibilityLabel={`${questionTypeLabels[type as keyof typeof questionTypeLabels]}: ${v.correct} / ${v.total}`} />
          </View>
        ))}
      </Card>

      {topTags.length > 0 ? (
        <Card>
          <AppText variant="subheading">Hata yaptığın alanlar</AppText>
          {topTags.map(([tag, n]) => (
            <AppText key={tag} color="textSecondary">• {errorTagLabels[tag as keyof typeof errorTagLabels] ?? tag}: {n} soru</AppText>
          ))}
        </Card>
      ) : null}

      <Card>
        <AppText variant="subheading">Tekrar önerisi</AppText>
        <AppText color="textSecondary">
          {passed && missed.length === 0
            ? "Harika, bu konuda bütün soruları doğru yaptın. Konuyu pekiştirmek için birkaç gün sonra sınavı yeniden çözebilirsin."
            : passed
              ? "Başarılısın. Aşağıdaki sorulara bir göz at ve açıklamaları oku; ardından sınavı yeniden çözebilirsin."
              : "Dersteki kural ve örnekleri bir kez daha oku, ardından alıştırmaları çöz ve sınavı yeniden dene. Aşağıdaki açıklamalar nerede takıldığını gösteriyor."}
        </AppText>
      </Card>

      {missed.length > 0 ? (
        <View style={styles.review}>
          <AppText variant="heading" accessibilityRole="header">Yanlış ve atlanan sorular</AppText>
          {missed.map((r) => {
            const q = byId.get(r.questionId);
            if (!q) return null;
            const skipped = r.isCorrect === null;
            const correct = describeCorrectAnswer(q);
            const feedback = r.answer ? findAnswerFeedback(q, r.answer) : null;
            return (
              <Card key={r.questionId}>
                <View style={styles.reviewHead}>
                  <Icon
                    name={skipped ? { ios: "arrow.uturn.forward.circle.fill", android: "skip_next", web: "skip_next" } : { ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
                    color={skipped ? colors.textSecondary : colors.danger}
                    size={22}
                  />
                  <AppText variant="bodyStrong" color={skipped ? "textSecondary" : "danger"}>{skipped ? "Atlandı" : "Yanlış"}</AppText>
                  <Badge label={questionTypeLabels[q.type]} />
                </View>
                <AppText variant="subheading">{questionText(q)}</AppText>
                {!skipped ? <AppText color="textSecondary">Senin cevabın: {r.answer}</AppText> : null}
                <AppText>Doğru cevap: <AppText variant="bodyStrong" color="success">{correct.correctAnswer}</AppText></AppText>
                {correct.alternativeAnswers.length > 0 ? (
                  <AppText variant="caption" color="textSecondary">Kabul edilen diğer cevaplar: {correct.alternativeAnswers.join("  ·  ")}</AppText>
                ) : null}
                {feedback ? <AppText>{feedback}</AppText> : null}
                <AppText color="textSecondary">{q.explanation}</AppText>
              </Card>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, alignItems: "center" },
  typeRow: { gap: spacing.xs, marginTop: spacing.sm },
  typeHead: { flexDirection: "row", justifyContent: "space-between" },
  review: { gap: spacing.md },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
