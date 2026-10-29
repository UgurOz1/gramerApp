import { Stack, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, ProgressBar, Screen, icons } from "@/components/common";
import { errorTagLabels, questionTypeLabels } from "@/constants/labels";
import { DEFAULT_PASS_PERCENT } from "@/constants/mastery";
import { getLessonContent, getQuestionById } from "@/data/contentRepository";
import { describeCorrectAnswer, findAnswerFeedback } from "@/domain/question-engine/evaluate";
import type { Question } from "@/domain/models";
import { breakdownByLesson, breakdownByType } from "@/domain/scoring/examScoring";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
import { useUserState } from "@/services/progress/userStore";
import { colors, gradients, radius, shadows, spacing } from "@/theme";

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
  const { examResults, reviewList } = useUserState();
  const result = examResults.find((r) => r.resultId === resultId);

  if (!result) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Sınav sonucu" }} />
        <Card>
          <AppText variant="heading">Sonuç bulunamadı</AppText>
          <AppText color="textSecondary">Bu sınav sonucu kayıtlı değil.</AppText>
        </Card>
        <Button title="Ana sayfaya dön" onPress={() => router.dismissTo("/")} />
      </Screen>
    );
  }

  const lesson = result.kind === "lesson" && result.lessonId ? getLessonContent(result.lessonId) : null;
  const title = lesson ? lesson.exam.title : "Karışık test";
  const passPercent = lesson ? lesson.exam.passPercent : DEFAULT_PASS_PERCENT;
  const passed = result.percent >= passPercent;
  const byType = breakdownByType(result.questionResults);
  const byLesson = breakdownByLesson(result.questionResults);
  const missed = result.questionResults.filter((r) => r.isCorrect !== true);
  const wrongOnly = result.questionResults.filter((r) => r.isCorrect === false);

  // Yanlış yapılan soruların hata etiketleri → "Hata yaptığın alanlar"
  const tagCounts = new Map<string, number>();
  for (const r of wrongOnly) {
    for (const tag of getQuestionById(r.questionId)?.errorTags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Tekrar önerisi: en çok yanlış yapılan konular
  const weakLessons = byLesson
    .filter((b) => b.correct < b.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 3);

  return (
    <Screen
      footer={
        lesson ? (
          <>
            <Button title="Sınavı yeniden çöz" icon={icons.replay} size="lg" onPress={() => router.replace({ pathname: "/exam/[lessonId]", params: { lessonId: lesson.id } })} />
            <Button title="Dersi tekrar aç" variant="secondary" onPress={() => router.replace({ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } })} />
            {wrongOnly.length > 0 ? <Button title="Yanlışlarımı incele" variant="secondary" onPress={() => router.push("/mistakes")} /> : null}
            <Button title="Ana sayfaya dön" variant="ghost" onPress={() => router.dismissTo("/")} />
          </>
        ) : (
          <>
            <Button title="Yeni karışık test" icon={icons.shuffle} size="lg" onPress={() => router.replace("/mixed")} />
            {wrongOnly.length > 0 ? <Button title="Yanlışlarımı incele" variant="secondary" onPress={() => router.push("/mistakes")} /> : null}
            <Button title="Ana sayfaya dön" variant="ghost" onPress={() => router.dismissTo("/")} />
          </>
        )
      }
    >
      <Stack.Screen options={{ title: "Sınav sonucu", headerBackVisible: false }} />

      <View style={[styles.hero, { borderColor: passed ? "#1F7A56" : "#7A5A1F", backgroundImage: passed ? "linear-gradient(160deg, #123A2E 0%, #141829 75%)" : "linear-gradient(160deg, #45341A 0%, #141829 75%)" }]}>
        <View style={[styles.orb, { backgroundImage: `radial-gradient(circle, ${passed ? "rgba(61,220,151,0.35)" : "rgba(255,200,97,0.3)"} 0%, transparent 70%)` }]} />
        <AppText style={styles.heroEmoji}>{result.percent === 100 ? "🏆" : passed ? "🎉" : "📚"}</AppText>
        <Badge label={passed ? "BAŞARILI" : "TEKRAR ÖNERİLİR"} tone={passed ? "success" : "warning"} />
        <AppText style={[styles.percent, { color: passed ? colors.success : colors.warning }]} accessibilityRole="header">%{result.percent}</AppText>
        <AppText variant="subheading" style={styles.center}>
          {result.percent === 100 ? "Kusursuz! Hepsi doğru." : passed ? "Tebrikler, sınavı geçtin!" : "Az kaldı, biraz daha pratik!"}
        </AppText>
        <View style={styles.full}>
          <ProgressBar value={result.percent / 100} height={12} color={passed ? gradients.success : gradients.warm} accessibilityLabel={`Başarı yüzdesi ${result.percent}`} />
        </View>
        <AppText variant="caption" color="textSecondary" style={styles.center}>{title} · başarı sınırı %{passPercent}</AppText>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.successMuted }]}><AppText variant="title" color="success">{result.correct}</AppText><AppText variant="caption" color="textSecondary">Doğru</AppText></View>
        <View style={[styles.stat, { backgroundColor: colors.dangerMuted }]}><AppText variant="title" color="danger">{result.wrong}</AppText><AppText variant="caption" color="textSecondary">Yanlış</AppText></View>
        <View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><AppText variant="title" color="textSecondary">{result.skipped}</AppText><AppText variant="caption" color="textSecondary">Atlanan</AppText></View>
      </View>

      {byLesson.length > 1 ? (
        <Card>
          <AppText variant="label" color="accent">KONU BAZINDA PERFORMANS</AppText>
          {byLesson.map((b) => {
            const name = getLessonSummary(b.lessonId)?.title ?? b.lessonId;
            return (
              <View key={b.lessonId} style={styles.typeRow}>
                <View style={styles.typeHead}>
                  <AppText style={styles.flex}>{name}</AppText>
                  <AppText color="textSecondary">{b.correct} / {b.total}</AppText>
                </View>
                <ProgressBar value={b.total ? b.correct / b.total : 0} color={gradients.success} accessibilityLabel={`${name}: ${b.correct} / ${b.total}`} />
              </View>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <AppText variant="label" color="accent">SORU TÜRÜNE GÖRE PERFORMANS</AppText>
        {Object.entries(byType).map(([type, v]) => {
          const label = questionTypeLabels[type as keyof typeof questionTypeLabels];
          return (
            <View key={type} style={styles.typeRow}>
              <View style={styles.typeHead}>
                <AppText>{label}</AppText>
                <AppText color="textSecondary">{v.correct} / {v.total}</AppText>
              </View>
              <ProgressBar value={v.total ? v.correct / v.total : 0} color={gradients.success} accessibilityLabel={`${label}: ${v.correct} / ${v.total}`} />
            </View>
          );
        })}
      </Card>

      {topTags.length > 0 ? (
        <Card>
          <AppText variant="label" color="danger">HATA YAPTIĞIN ALANLAR</AppText>
          {topTags.map(([tag, n]) => (
            <View key={tag} style={styles.tagRow}>
              <AppText style={styles.flex}>{errorTagLabels[tag as keyof typeof errorTagLabels] ?? tag}</AppText>
              <Badge label={`${n} soru`} tone="danger" />
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <AppText variant="label" color="warning">💡 TEKRAR ÖNERİSİ</AppText>
        <AppText color="textSecondary">
          {passed && missed.length === 0
            ? "Harika, bütün soruları doğru yaptın. Konuyu pekiştirmek için birkaç gün sonra yeniden deneyebilirsin."
            : passed
              ? "Başarılısın. Aşağıdaki sorulara göz atıp açıklamaları oku; yanlışların Yanlışlarım listene eklendi."
              : "Kural ve örnekleri bir kez daha oku, ardından alıştırmaları çöz ve yeniden dene. Aşağıdaki açıklamalar nerede takıldığını gösteriyor."}
        </AppText>
        {weakLessons.map((w) => {
          const name = getLessonSummary(w.lessonId)?.title ?? w.lessonId;
          const listed = reviewList.some((r) => r.lessonId === w.lessonId);
          return (
            <View key={w.lessonId} style={styles.weak}>
              <AppText variant="bodyStrong">{name}</AppText>
              <AppText variant="caption" color="textSecondary">{w.correct} / {w.total} doğru{listed ? " · tekrar listende" : ""}</AppText>
              <Button title="Dersi aç" icon={icons.book} variant="secondary" onPress={() => router.push(lessonHref(w.lessonId))} />
            </View>
          );
        })}
      </Card>

      {missed.length > 0 ? (
        <View style={styles.review}>
          <AppText variant="heading" accessibilityRole="header">Yanlış ve atlanan sorular</AppText>
          {missed.map((r) => {
            const q = getQuestionById(r.questionId);
            if (!q) return null;
            const skipped = r.isCorrect === null;
            const correct = describeCorrectAnswer(q);
            const feedback = r.answer ? findAnswerFeedback(q, r.answer) : null;
            return (
              <Card key={r.questionId} accentColor={skipped ? colors.borderStrong : colors.danger}>
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
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: colors.surface,
    boxShadow: shadows.raised,
  },
  orb: { position: "absolute", width: 320, height: 320, top: -170 },
  heroEmoji: { fontSize: 64, lineHeight: 76 },
  percent: { fontSize: 64, lineHeight: 72, fontWeight: "900", letterSpacing: -2 },
  center: { textAlign: "center" },
  full: { alignSelf: "stretch" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.lg, borderRadius: radius.lg },
  typeRow: { gap: spacing.xs, marginTop: spacing.sm },
  typeHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  flex: { flex: 1 },
  weak: { gap: spacing.xs, marginTop: spacing.md },
  review: { gap: spacing.md },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
