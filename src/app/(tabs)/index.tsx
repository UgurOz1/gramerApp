import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ProgressBar, Screen, SectionHeader } from "@/components/common";
import { LevelCard } from "@/components/progress/LevelCard";
import { getQuestionById } from "@/data/contentRepository";
import { getLessonStatus, isLessonCompleted, lessonStatusLabels } from "@/domain/progress/lessonStatus";
import {
  getCatalogStats,
  getLessonSummary,
  getLessonsForLevel,
  getLevels,
  isLessonAvailable,
} from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
import { buildMistakeItems, unresolvedItems } from "@/features/mistakes/viewModel";
import { levelProgress, quickStats } from "@/features/progress/summary";
import { suggestToday, type Suggestion } from "@/features/progress/suggestion";
import { useMastery } from "@/features/progress/useMastery";
import { REVIEW_NEEDED_BELOW } from "@/constants/mastery";
import { useUserState } from "@/services/progress/userStore";
import { formatPercent } from "@/utils/format";
import { spacing } from "@/theme";

export default function HomeScreen() {
  const state = useUserState();
  const mastery = useMastery();
  const levels = getLevels();
  const stats = getCatalogStats();
  const allLessons = levels.flatMap((l) => getLessonsForLevel(l.id));

  const unresolved = unresolvedItems(buildMistakeItems(state.mistakes, getQuestionById)).length;
  const quick = quickStats(state);
  const levelStats = levels.map((l) => ({ level: l, ...levelProgress(getLessonsForLevel(l.id), state, mastery) }));
  const overall = allLessons.length
    ? levelStats.reduce((sum, s) => sum + s.value * s.total, 0) / allLessons.length
    : 0;

  const lastLesson = state.lastLessonId ? getLessonSummary(state.lastLessonId) : undefined;
  const continueLesson =
    lastLesson && isLessonAvailable(lastLesson.id) ? lastLesson : allLessons.find((l) => isLessonAvailable(l.id));

  const suggestion = suggestToday({
    unresolvedMistakeCount: unresolved,
    reviewNeededLessonIds: allLessons
      .filter((l) => {
        const m = mastery[l.id];
        return !!m && m.band !== "not_enough_data" && m.score < REVIEW_NEEDED_BELOW && state.lessonProgress[l.id]?.practiceCompletedAt !== undefined;
      })
      .sort((a, b) => mastery[a.id].score - mastery[b.id].score)
      .map((l) => l.id),
    reviewListLessonIds: state.reviewList.filter((r) => isLessonAvailable(r.lessonId)).map((r) => r.lessonId),
    inProgressLessonIds: Object.values(state.lessonProgress)
      .filter((p) => isLessonAvailable(p.lessonId) && !isLessonCompleted(p))
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .map((p) => p.lessonId),
    newLessonIds: allLessons.filter((l) => isLessonAvailable(l.id) && !state.lessonProgress[l.id]).map((l) => l.id),
    availableLessonCount: stats.availableLessonCount,
    titleOf: (id) => getLessonSummary(id)?.title ?? id,
  });

  const openSuggestion = (s: Suggestion) => {
    switch (s.kind) {
      case "mistakes": return router.push("/mistakes");
      case "mixed": return router.push("/mixed");
      case "none": return;
      default: return router.push(lessonHref(s.lessonId));
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title">Merhaba!</AppText>
        <AppText color="textSecondary">
          {"A1'den B2'ye İngilizce grameri adım adım öğren. Her şey cihazında, internet gerekmez."}
        </AppText>
      </View>

      <Card>
        <AppText variant="label" color="accent">GENEL İLERLEME</AppText>
        <AppText variant="title">{formatPercent(overall)}</AppText>
        <ProgressBar value={overall} accessibilityLabel={`Genel ilerleme yüzde ${Math.round(overall * 100)}`} />
        <AppText variant="caption" color="textSecondary">
          Ders tamamlama ve konu ustalığı birlikte hesaplanır. {stats.availableLessonCount} / {stats.lessonCount} konunun içeriği hazır.
        </AppText>
      </Card>

      {continueLesson ? (
        <Card>
          <AppText variant="label" color="accent">{lastLesson && continueLesson.id === lastLesson.id ? "KALDIĞIN YERDEN DEVAM ET" : "BURADAN BAŞLA"}</AppText>
          <AppText variant="subheading">{continueLesson.title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {lessonStatusLabels[getLessonStatus(state.lessonProgress[continueLesson.id], mastery[continueLesson.id])]} · ~{continueLesson.estimatedMinutes} dk
          </AppText>
          <Button title="Devam et" onPress={() => router.push(lessonHref(continueLesson.id))} />
        </Card>
      ) : null}

      <Card>
        <AppText variant="label" color="accent">GÜNÜN ÇALIŞMA ÖNERİSİ</AppText>
        <AppText variant="subheading">{suggestion.title}</AppText>
        <AppText color="textSecondary">{suggestion.description}</AppText>
        {suggestion.kind !== "none" ? <Button title="Başla" variant="secondary" onPress={() => openSuggestion(suggestion)} /> : null}
      </Card>

      <View style={styles.row}>
        <Card style={styles.half} onPress={() => router.push("/mistakes")} accessibilityLabel={`Yanlışlarım, ${unresolved} çözülmemiş soru`}>
          <AppText variant="title" color={unresolved > 0 ? "danger" : "text"}>{unresolved}</AppText>
          <AppText variant="bodyStrong">Yanlışlarım</AppText>
          <AppText variant="caption" color="textSecondary">çözülmemiş soru</AppText>
        </Card>
        <Card style={styles.half} onPress={() => router.push("/review")} accessibilityLabel={`Tekrar listem, ${state.reviewList.length} konu`}>
          <AppText variant="title">{state.reviewList.length}</AppText>
          <AppText variant="bodyStrong">Tekrar listem</AppText>
          <AppText variant="caption" color="textSecondary">konu</AppText>
        </Card>
      </View>
      <Button title="Karışık test çöz" variant="secondary" onPress={() => router.push("/mixed")} />

      <SectionHeader title="Seviyeler" subtitle={`${stats.lessonCount} konu, ${stats.unitCount} ünite`} />
      {levelStats.map(({ level, value, completed, total, available }) => (
        <LevelCard
          key={level.id}
          level={level}
          lessonCount={total}
          progress={value}
          detail={`${completed} / ${total} ders tamamlandı${available < total ? ` · ${available} konunun içeriği hazır` : ""}`}
          onPress={() => router.push({ pathname: "/level/[levelId]", params: { levelId: level.id } })}
        />
      ))}

      <Card>
        <AppText variant="subheading">İstatistik özeti</AppText>
        <AppText color="textSecondary">Çözülen soru: {quick.answered}</AppText>
        <AppText color="textSecondary">Doğruluk: {quick.accuracy === null ? "—" : `%${Math.round(quick.accuracy * 100)}`}</AppText>
        <AppText color="textSecondary">Tamamlanan ders: {quick.completedLessons}</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
});
