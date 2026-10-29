import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, IconBubble, ProgressBar, Screen, SectionHeader, icons, type IconName } from "@/components/common";
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
import { DAILY_GOAL, computeStreak } from "@/features/progress/streak";
import { levelProgress, quickStats } from "@/features/progress/summary";
import { suggestToday, type Suggestion } from "@/features/progress/suggestion";
import { useMastery } from "@/features/progress/useMastery";
import { REVIEW_NEEDED_BELOW } from "@/constants/mastery";
import { useUserState } from "@/services/progress/userStore";
import { formatPercent } from "@/utils/format";
import { colors, gradients, levelTheme, radius, shadows, spacing } from "@/theme";

const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function greeting(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

const suggestionIcon: Record<Suggestion["kind"], IconName> = {
  mistakes: icons.error,
  mixed: icons.shuffle,
  none: icons.star,
  review_lesson: icons.replay,
  continue_lesson: icons.play,
  new_lesson: icons.book,
};

export default function HomeScreen() {
  const state = useUserState();
  const mastery = useMastery();
  const levels = getLevels();
  const stats = getCatalogStats();
  const allLessons = levels.flatMap((l) => getLessonsForLevel(l.id));

  const unresolved = unresolvedItems(buildMistakeItems(state.mistakes, getQuestionById)).length;
  const quick = quickStats(state);
  const streak = computeStreak(state.attempts);
  const levelStats = levels.map((l) => ({ level: l, ...levelProgress(getLessonsForLevel(l.id), state, mastery) }));
  const overall = allLessons.length
    ? levelStats.reduce((sum, s) => sum + s.value * s.total, 0) / allLessons.length
    : 0;

  const lastLesson = state.lastLessonId ? getLessonSummary(state.lastLessonId) : undefined;
  const continueLesson =
    lastLesson && isLessonAvailable(lastLesson.id) ? lastLesson : allLessons.find((l) => isLessonAvailable(l.id));
  const isResume = !!lastLesson && continueLesson?.id === lastLesson.id;

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

  const goal = Math.min(1, streak.todayCount / DAILY_GOAL);
  const goalDone = streak.todayCount >= DAILY_GOAL;
  const continueTheme = continueLesson ? levelTheme(continueLesson.levelId) : levelTheme("a1");

  return (
    <Screen safeTop>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <AppText variant="caption" color="textSecondary">{greeting(new Date().getHours())} 👋</AppText>
          <AppText variant="display">GrammarPath</AppText>
        </View>
        <View
          style={[styles.streakPill, streak.current > 0 && styles.streakPillActive]}
          accessible
          accessibilityLabel={`${streak.current} günlük seri`}
        >
          <AppText style={styles.streakEmoji}>{streak.current > 0 ? "🔥" : "🌙"}</AppText>
          <AppText variant="subheading" style={{ color: streak.current > 0 ? colors.warning : colors.textSecondary }}>
            {streak.current}
          </AppText>
        </View>
      </View>

      {continueLesson ? (
        <View style={styles.hero}>
          <View style={[styles.heroOrb, { backgroundImage: `radial-gradient(circle, ${continueTheme.color}55 0%, transparent 70%)` }]} />
          <AppText variant="label" style={styles.heroLabel}>{isResume ? "KALDIĞIN YERDEN DEVAM ET" : "BURADAN BAŞLA"}</AppText>
          <AppText variant="title" style={styles.heroTitle}>{continueLesson.title}</AppText>
          <View style={styles.heroMeta}>
            <Badge label={continueLesson.levelId.toUpperCase()} color={{ bg: continueTheme.muted, fg: continueTheme.color }} />
            <Badge label={`~${continueLesson.estimatedMinutes} dk`} color={{ bg: "rgba(255,255,255,0.10)", fg: colors.text }} />
            <Badge
              label={lessonStatusLabels[getLessonStatus(state.lessonProgress[continueLesson.id], mastery[continueLesson.id])]}
              color={{ bg: "rgba(255,255,255,0.10)", fg: colors.text }}
            />
          </View>
          <Button title={isResume ? "Devam et" : "Başla"} icon={icons.play} size="lg" onPress={() => router.push(lessonHref(continueLesson.id))} />
        </View>
      ) : null}

      <Card>
        <View style={styles.goalHead}>
          <IconBubble icon={icons.target} color={goalDone ? colors.success : colors.accent} background={goalDone ? colors.successMuted : colors.accentMuted} size={40} />
          <View style={styles.flex}>
            <AppText variant="subheading">{goalDone ? "Günlük hedef tamam! 🎉" : "Günlük hedef"}</AppText>
            <AppText variant="caption" color="textSecondary">
              {goalDone ? "Harika gidiyorsun, serin devam ediyor." : `Bugün ${DAILY_GOAL - streak.todayCount} soru daha çöz, serini koru.`}
            </AppText>
          </View>
          <AppText variant="subheading" color={goalDone ? "success" : "text"}>
            {Math.min(streak.todayCount, DAILY_GOAL)}/{DAILY_GOAL}
          </AppText>
        </View>
        <ProgressBar value={goal} color={goalDone ? gradients.success : gradients.warm} accessibilityLabel={`Günlük hedef: ${streak.todayCount} / ${DAILY_GOAL} soru`} />
        <View style={styles.week} accessibilityLabel="Son 7 gün">
          {streak.week.map((d, i) => {
            const [y, m, day] = d.key.split("-").map(Number);
            const isToday = i === streak.week.length - 1;
            return (
              <View key={d.key} style={styles.dayCol}>
                <View style={[styles.dayDot, d.active && styles.dayDotActive, isToday && !d.active && styles.dayDotToday]}>
                  {d.active ? <AppText style={styles.dayEmoji}>🔥</AppText> : null}
                </View>
                <AppText variant="caption" color={isToday ? "text" : "textMuted"}>
                  {WEEKDAYS[new Date(y, m - 1, day).getDay()]}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      {suggestion.kind !== "none" ? (
        <Card onPress={() => openSuggestion(suggestion)} accessibilityLabel={`Günün önerisi: ${suggestion.title}`}>
          <View style={styles.goalHead}>
            <IconBubble icon={suggestionIcon[suggestion.kind]} color="#FFFFFF" background={colors.accentStrong} gradient={gradients.primary} size={44} />
            <View style={styles.flex}>
              <AppText variant="label" color="accent">GÜNÜN ÖNERİSİ</AppText>
              <AppText variant="subheading">{suggestion.title}</AppText>
            </View>
            <Icon name={icons.chevronRight} color={colors.textMuted} size={20} />
          </View>
          <AppText variant="caption" color="textSecondary">{suggestion.description}</AppText>
        </Card>
      ) : null}

      <View style={styles.grid}>
        <QuickTile
          icon={icons.error}
          color={colors.danger}
          bg={colors.dangerMuted}
          value={String(unresolved)}
          title="Yanlışlarım"
          subtitle="çözülmemiş soru"
          onPress={() => router.push("/mistakes")}
        />
        <QuickTile
          icon={icons.bookmark}
          color={colors.warning}
          bg={colors.warningMuted}
          value={String(state.reviewList.length)}
          title="Tekrar listem"
          subtitle="konu"
          onPress={() => router.push("/review")}
        />
        <QuickTile
          icon={icons.shuffle}
          color={colors.info}
          bg={colors.infoMuted}
          title="Karışık test"
          subtitle="konuları harmanla"
          onPress={() => router.push("/mixed")}
        />
        <QuickTile
          icon={icons.compare}
          color={colors.accent}
          bg={colors.accentMuted}
          title="Karşılaştır"
          subtitle="benzer yapılar"
          onPress={() => router.push("/comparisons")}
        />
      </View>

      <SectionHeader
        title="Yolculuğun"
        subtitle={`Genel ilerleme ${formatPercent(overall)} · ${stats.availableLessonCount} / ${stats.lessonCount} konu hazır`}
        action={{ label: "Tümü", onPress: () => router.push("/levels") }}
      />
      {levelStats.map(({ level, value, completed, total }) => (
        <LevelCard
          key={level.id}
          level={level}
          lessonCount={total}
          progress={value}
          detail={`${completed} / ${total} ders tamamlandı`}
          onPress={() => router.push({ pathname: "/level/[levelId]", params: { levelId: level.id } })}
        />
      ))}

      <SectionHeader title="İstatistikler" />
      <View style={styles.statsRow}>
        <Stat emoji="✍️" value={String(quick.answered)} label="Çözülen soru" />
        <Stat emoji="🎯" value={quick.accuracy === null ? "—" : `%${Math.round(quick.accuracy * 100)}`} label="Doğruluk" />
        <Stat emoji="📚" value={String(quick.completedLessons)} label="Biten ders" />
      </View>
    </Screen>
  );
}

function QuickTile(props: { icon: IconName; color: string; bg: string; value?: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Card onPress={props.onPress} style={styles.tile} accessibilityLabel={`${props.title}${props.value ? `, ${props.value} ${props.subtitle}` : ""}`}>
      <View style={styles.tileTop}>
        <IconBubble icon={props.icon} color={props.color} background={props.bg} size={40} />
        {props.value !== undefined ? <AppText variant="title" style={{ color: props.value === "0" ? colors.textMuted : props.color }}>{props.value}</AppText> : null}
      </View>
      <View>
        <AppText variant="bodyStrong">{props.title}</AppText>
        <AppText variant="caption" color="textSecondary">{props.subtitle}</AppText>
      </View>
    </Card>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText style={styles.statEmoji}>{emoji}</AppText>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakPillActive: { backgroundColor: colors.warningMuted, borderColor: "#6B4F1E" },
  streakEmoji: { fontSize: 18, lineHeight: 22 },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: "hidden",
    backgroundColor: "#2A2470",
    backgroundImage: gradients.hero,
    borderWidth: 1,
    borderColor: "#4A3FB5",
    boxShadow: shadows.raised,
  },
  heroOrb: { position: "absolute", width: 260, height: 260, right: -90, top: -110 },
  heroLabel: { color: "#C9C2FF" },
  heroTitle: { color: "#FFFFFF" },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xs },
  goalHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  week: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  dayCol: { alignItems: "center", gap: 6 },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: { backgroundColor: colors.warningMuted, borderWidth: 1.5, borderColor: colors.warning },
  dayDotToday: { borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: "dashed" },
  dayEmoji: { fontSize: 15, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: { flexBasis: "47%", flexGrow: 1, gap: spacing.md, minHeight: 132, justifyContent: "space-between" },
  tileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: { fontSize: 22, lineHeight: 28 },
});
