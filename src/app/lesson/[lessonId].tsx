import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, Screen, icons } from "@/components/common";
import { SectionView } from "@/components/lesson/SectionView";
import { getLessonContent } from "@/data/contentRepository";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { colors, levelTheme, radius, shadows, spacing } from "@/theme";

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const summary = getLessonSummary(lessonId);
  const { preferences, reviewList } = useUserState();
  const inReviewList = reviewList.some((r) => r.lessonId === lessonId);
  const [sessionId] = useState(() => progressService.newSessionId());

  useEffect(() => {
    if (lesson) progressService.openLesson(lessonId);
  }, [lesson, lessonId]);

  if (!lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: summary?.title ?? "Ders" }} />
        <Card>
          <AppText style={styles.soonEmoji}>🛠️</AppText>
          <AppText variant="heading">Bu ders henüz hazır değil</AppText>
          <AppText color="textSecondary">Bu konunun içeriği ileride eklenecek. Şimdilik hazır olan derslerden devam edebilirsin.</AppText>
        </Card>
      </Screen>
    );
  }

  const theme = levelTheme(lesson.levelId);

  return (
    <Screen
      onReachEnd={() => progressService.markLessonRead(lessonId)}
      footer={
        <>
          <Button
            title="Alıştırmalara geç"
            icon={icons.play}
            size="lg"
            onPress={() => {
              progressService.markLessonRead(lessonId);
              router.push({ pathname: "/practice/[lessonId]", params: { lessonId } });
            }}
          />
          <Button
            title="Doğrudan konu sonu sınavına git"
            variant="ghost"
            onPress={() => router.push({ pathname: "/exam/[lessonId]", params: { lessonId } })}
          />
        </>
      }
    >
      <Stack.Screen options={{ title: lesson.title }} />
      <View style={[styles.hero, { borderColor: `${theme.color}55`, backgroundImage: `linear-gradient(155deg, ${theme.muted} 0%, ${colors.surface} 75%)` }]}>
        <View style={[styles.orb, { backgroundImage: `radial-gradient(circle, ${theme.color}45 0%, transparent 70%)` }]} />
        <View style={styles.heroTop}>
          <Badge label={`${lesson.levelId.toUpperCase()} ${theme.emoji}`} color={{ bg: theme.muted, fg: theme.color }} />
          {summary ? <Badge label={`⏱ ${summary.estimatedMinutes} dk`} /> : null}
          <Badge label={`📝 ${lesson.exercises.length} alıştırma`} />
          <View style={styles.flex} />
          <Pressable
            onPress={() => (inReviewList ? progressService.removeFromReviewList(lessonId) : progressService.addToReviewList(lessonId))}
            accessibilityRole="button"
            accessibilityLabel={inReviewList ? "Tekrar listemden çıkar" : "Tekrar listeme ekle"}
            accessibilityHint="Tekrar listesi yanlışlar listesinden ayrıdır"
            hitSlop={10}
            style={({ pressed }) => [styles.bookmark, inReviewList && styles.bookmarkOn, pressed && { opacity: 0.7 }]}
          >
            <Icon name={inReviewList ? icons.bookmark : icons.bookmarkAdd} size={20} color={inReviewList ? colors.warning : colors.textSecondary} />
          </Pressable>
        </View>
        <AppText variant="display" accessibilityRole="header">{lesson.title}</AppText>

        <View style={styles.objectives}>
          <AppText variant="label" style={{ color: theme.color }}>BU DERSTE ÖĞRENECEKLERİN</AppText>
          {lesson.objectives.map((o) => (
            <View key={o} style={styles.objective}>
              <View style={[styles.check, { backgroundColor: theme.muted }]}>
                <Icon name={icons.check} size={14} color={theme.color} />
              </View>
              <AppText style={styles.flex}>{o}</AppText>
            </View>
          ))}
        </View>
      </View>

      {lesson.sections.map((section) => (
        <SectionView key={section.id} section={section} lesson={lesson} sessionId={sessionId} showHint={preferences.showHints} />
      ))}

      <View style={styles.end}>
        <AppText style={styles.endEmoji}>🎯</AppText>
        <AppText variant="heading" style={styles.center}>Dersi bitirdin!</AppText>
        <AppText color="textSecondary" style={styles.center}>
          Şimdi alıştırmalarla pekiştir, sonra konu sonu sınavıyla kendini ölç.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  soonEmoji: { fontSize: 40, lineHeight: 48 },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: colors.surface,
    boxShadow: shadows.raised,
  },
  orb: { position: "absolute", width: 260, height: 260, right: -100, top: -120 },
  heroTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  bookmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookmarkOn: { backgroundColor: colors.warningMuted, borderColor: colors.warning },
  objectives: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: "rgba(10,12,22,0.45)" },
  objective: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  end: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xl },
  endEmoji: { fontSize: 44, lineHeight: 52 },
});
