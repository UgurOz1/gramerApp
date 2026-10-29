import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Chip, PageHero, Screen, SectionHeader, icons } from "@/components/common";
import { questionTypeLabels } from "@/constants/labels";
import { getAllQuestionsForLesson, getAvailableLessonIds, getCurriculum } from "@/data/contentRepository";
import { countAvailableQuestions } from "@/domain/mixed/buildMixedTest";
import { QUESTION_TYPES, type LevelId, type QuestionType } from "@/domain/models";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { resolveScopeLessons, type MixedScope } from "@/features/mixed/scope";
import { useUserState } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";

type ScopeKind = MixedScope["kind"];

const SCOPE_LABELS: Record<ScopeKind, string> = {
  all: "Tüm seviyeler",
  level: "Belirli seviye",
  units: "Belirli üniteler",
  lessons: "Seçtiğim konular",
  mistakes: "Yanlış yaptığım konular",
  review: "Tekrar listem",
};
const COUNTS = [10, 15, 20, 30];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function MixedSetupScreen() {
  const params = useLocalSearchParams<{ scope?: string }>();
  const { mistakes, reviewList, preferences } = useUserState();
  const curriculum = getCurriculum();

  const initialScope = (Object.keys(SCOPE_LABELS) as ScopeKind[]).includes(params.scope as ScopeKind) ? (params.scope as ScopeKind) : "all";
  const [scopeKind, setScopeKind] = useState<ScopeKind>(initialScope);
  const [levelId, setLevelId] = useState<LevelId>("a1");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [types, setTypes] = useState<QuestionType[]>([...QUESTION_TYPES]);
  const [count, setCount] = useState<number>(COUNTS.includes(preferences.defaultMixedQuestionCount) ? preferences.defaultMixedQuestionCount : 15);

  const availableIds = useMemo(() => new Set(getAvailableLessonIds()), []);

  const scope: MixedScope = useMemo(() => {
    switch (scopeKind) {
      case "level": return { kind: "level", levelId };
      case "units": return { kind: "units", unitIds };
      case "lessons": return { kind: "lessons", lessonIds };
      default: return { kind: scopeKind };
    }
  }, [scopeKind, levelId, unitIds, lessonIds]);

  const scopeLessons = useMemo(
    () => (curriculum ? resolveScopeLessons(scope, { curriculum, availableLessonIds: availableIds, mistakes, reviewList }) : []),
    [scope, curriculum, availableIds, mistakes, reviewList],
  );
  const pool = useMemo(() => scopeLessons.flatMap((id) => getAllQuestionsForLesson(id)), [scopeLessons]);
  const available = countAvailableQuestions(pool, types);
  const actual = Math.min(count, available);

  if (!curriculum) return null;

  const unitsWithContent = curriculum.units.filter((u) => u.lessonIds.some((id) => availableIds.has(id)));

  const start = () => {
    const seed = String(Date.now());
    router.push({
      pathname: "/mixed/run",
      params: { lessons: scopeLessons.join(","), types: types.join(","), count: String(count), seed },
    });
  };

  let emptyReason: string | null = null;
  if (scopeLessons.length === 0) {
    emptyReason =
      scopeKind === "mistakes" ? "Çözülmemiş yanlışın olan konu yok."
      : scopeKind === "review" ? "Tekrar listende içeriği hazır konu yok."
      : scopeKind === "units" || scopeKind === "lessons" ? "Yukarıdan en az bir konu veya ünite seç."
      : "Bu kapsamda içeriği hazır konu yok.";
  } else if (types.length === 0) emptyReason = "En az bir soru türü seç.";
  else if (available === 0) emptyReason = "Seçtiğin kapsam ve soru türlerinde soru yok.";

  return (
    <Screen
      footer={
        <>
          {emptyReason ? <AppText color="warning">{emptyReason}</AppText> : (
            <AppText color="textSecondary">{scopeLessons.length} konudan {actual} soru · sınav gibi çözülür</AppText>
          )}
          <Button title="Testi başlat" icon={icons.play} size="lg" disabled={!!emptyReason} onPress={start} />
        </>
      }
    >
      <PageHero
        emoji="🎲"
        title="Karışık test"
        subtitle="Birden fazla konudan karışık sorular. Hangi kuralın gerektiğini sen çıkarırsın; doğru cevaplar test bitince gösterilir."
        color={colors.info}
      />

      <SectionHeader title="Kapsam" />
      <View style={styles.chips}>
        {(Object.keys(SCOPE_LABELS) as ScopeKind[]).map((k) => (
          <Chip key={k} label={SCOPE_LABELS[k]} selected={scopeKind === k} onPress={() => setScopeKind(k)} />
        ))}
      </View>

      {scopeKind === "level" ? (
        <View style={styles.chips}>
          {curriculum.levels.map((l) => (
            <Chip key={l.id} label={l.code} selected={levelId === l.id} onPress={() => setLevelId(l.id)} />
          ))}
        </View>
      ) : null}

      {scopeKind === "units" ? (
        <Card>
          {unitsWithContent.length === 0 ? <AppText color="textSecondary">İçeriği hazır ünite yok.</AppText> : null}
          <View style={styles.chips}>
            {unitsWithContent.map((u) => (
              <Chip key={u.id} label={`${u.levelId.toUpperCase()} · ${u.title}`} selected={unitIds.includes(u.id)} onPress={() => setUnitIds((l) => toggle(l, u.id))} />
            ))}
          </View>
        </Card>
      ) : null}

      {scopeKind === "lessons" ? (
        <Card>
          <View style={styles.chips}>
            {[...availableIds].map((id) => (
              <Chip key={id} label={getLessonSummary(id)?.title ?? id} selected={lessonIds.includes(id)} onPress={() => setLessonIds((l) => toggle(l, id))} />
            ))}
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Soru türleri" />
      <View style={styles.chips}>
        {QUESTION_TYPES.map((t) => (
          <Chip key={t} label={questionTypeLabels[t]} selected={types.includes(t)} onPress={() => setTypes((l) => toggle(l, t))} />
        ))}
      </View>

      <SectionHeader title="Soru sayısı" subtitle={available > 0 && count > available ? `Kapsamda yalnızca ${available} soru var.` : undefined} />
      <View style={styles.chips}>
        {COUNTS.map((c) => (
          <Chip key={c} label={String(c)} selected={count === c} onPress={() => setCount(c)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
