import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, Screen, icons } from "@/components/common";
import { QuickTryCard } from "@/components/lesson/QuickTryCard";
import { SectionView } from "@/components/lesson/SectionView";
import { getLessonContent } from "@/data/contentRepository";
import { buildQuickTry, type QuickTry } from "@/features/lesson/quickTry";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import type { LessonSection } from "@/domain/models";
import { colors, levelTheme, radius, shadows, spacing } from "@/theme";

const stepLabels: Record<string, string> = {
  intro: "Giriş",
  rule: "Kural",
  forms: "Yapılar",
  examples: "Örnekler",
  usage: "Kullanım",
  mistakes: "Dikkat",
  confusions: "Karıştırma",
  notes: "Notlar",
  check: "Kendini dene",
};

const EXAMPLES_PER_STEP = 5;

type Step = { key: string; label: string; section?: LessonSection; quick?: QuickTry };

/** Adım göstergesi: her adım bir parça; geçilen adımlara dokunarak dönülebilir. */
function StepHeader({ steps, index, color, onJump }: { steps: Step[]; index: number; color: string; onJump: (i: number) => void }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.segments}>
        {steps.map((st, i) => (
          <Pressable
            key={st.key}
            disabled={i > index}
            onPress={() => onJump(i)}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`${i + 1}. adım: ${st.label}`}
            style={[styles.segment, { backgroundColor: i <= index ? color : colors.surfaceRaised }, i === index && styles.segmentNow]}
          />
        ))}
      </View>
      <View style={styles.stepInfo}>
        <AppText variant="caption" color="textSecondary">
          Adım {index + 1} / {steps.length}
        </AppText>
        <AppText variant="label" style={{ color }}>{steps[index].label.toUpperCase()}</AppText>
      </View>
    </View>
  );
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonContent(lessonId);
  const summary = getLessonSummary(lessonId);
  const { preferences, reviewList } = useUserState();
  const inReviewList = reviewList.some((r) => r.lessonId === lessonId);
  const [sessionId] = useState(() => progressService.newSessionId());
  const [index, setIndex] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));

  const steps = useMemo<Step[]>(() => {
    if (!lesson) return [];
    const used = new Set<string>();
    const sectionSteps = lesson.sections.flatMap((section): Step[] => {
      const label = stepLabels[section.type] ?? "Konu";
      if (section.type === "examples" && section.exampleIds.length > EXAMPLES_PER_STEP) {
        // Uzun örnek listeleri kaydırma yerine küçük sayfalara bölünür.
        const pages = Math.ceil(section.exampleIds.length / EXAMPLES_PER_STEP);
        return Array.from({ length: pages }, (_, i) => ({
          key: `${section.id}-${i}`,
          label,
          section: {
            ...section,
            title: `${section.title.replace(/\s*\(\d+\)$/, "")} · ${i + 1}/${pages}`,
            exampleIds: section.exampleIds.slice(i * EXAMPLES_PER_STEP, (i + 1) * EXAMPLES_PER_STEP),
          },
        }));
      }
      const steps: Step[] = [{ key: section.id, label, section }];
      // Kural anlatımından hemen sonra, o kuralın örneğiyle tek soruluk deneme.
      const quick = buildQuickTry(lesson, section, used);
      if (quick) {
        used.add(quick.exampleId);
        steps.push({ key: `${section.id}-try`, label: "Hemen dene", quick });
      }
      return steps;
    });
    return [{ key: "cover", label: "Başlangıç" }, ...sectionSteps, { key: "finish", label: "Bitiş" }];
  }, [lesson]);
  const last = steps.length - 1;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [index, fade]);

  useEffect(() => {
    if (lesson && index === last) progressService.markLessonRead(lessonId);
  }, [lesson, index, last, lessonId]);

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

  const step = steps[index];
  const isLast = index === last;

  const hero = (
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
      <AppText variant="caption" color="textSecondary">
        Konu {steps.length - 2} kısa adımda anlatılıyor; kuralların ardından küçük denemeler var. Her adımı bitirince “Devam”a dokun; geçtiğin adımlara üstteki çubuktan dönebilirsin.
      </AppText>
    </View>
  );

  const finish = (
    <View style={styles.end}>
      <AppText style={styles.endEmoji}>🎯</AppText>
      <AppText variant="heading" style={styles.center}>Konuyu bitirdin!</AppText>
      <AppText color="textSecondary" style={styles.center}>
        Öğrendiklerini alıştırmalarla pekiştir, sonra konu sonu sınavıyla kendini ölç. Takıldığın yer olursa istediğin adıma geri dönebilirsin.
      </AppText>
      <Button title="Konuyu baştan tekrar et" variant="ghost" onPress={() => setIndex(0)} />
    </View>
  );

  return (
    <Screen
      resetKey={index}
      header={<StepHeader steps={steps} index={index} color={theme.color} onJump={setIndex} />}
      footer={
        isLast ? (
          <>
            <Button
              title="Alıştırmalara geç"
              icon={icons.play}
              size="lg"
              onPress={() => router.push({ pathname: "/practice/[lessonId]", params: { lessonId } })}
            />
            <Button
              title="Doğrudan konu sonu sınavına git"
              variant="ghost"
              onPress={() => router.push({ pathname: "/exam/[lessonId]", params: { lessonId } })}
            />
          </>
        ) : (
          <View style={styles.navRow}>
            {index > 0 ? (
              <View style={styles.navBack}>
                <Button title="Geri" variant="secondary" onPress={() => setIndex(index - 1)} />
              </View>
            ) : null}
            <View style={styles.flex}>
              <Button title={index === 0 ? "Başlayalım" : "Devam"} icon={icons.arrowRight} size="lg" onPress={() => setIndex(index + 1)} />
            </View>
          </View>
        )
      }
    >
      <Stack.Screen options={{ title: lesson.title }} />
      <Animated.View style={[styles.stepBody, { opacity: fade, transform: [{ translateX: fade.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
        {step.key === "cover" ? hero : step.key === "finish" ? finish : step.quick ? (
          <QuickTryCard key={step.key} quick={step.quick} />
        ) : step.section ? (
          <SectionView section={step.section} lesson={lesson} sessionId={sessionId} showHint={preferences.showHints} />
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stepBody: { gap: spacing.lg },
  stepHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.sm },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  segmentNow: { height: 7, marginTop: -1 },
  stepInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  navBack: { width: 110 },
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
