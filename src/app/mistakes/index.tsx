import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Chip, PageHero, Screen, icons } from "@/components/common";
import { MistakeCard } from "@/components/progress/MistakeCard";
import { getQuestionById } from "@/data/contentRepository";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { buildMistakeItems, topMistakeLessons, unresolvedItems } from "@/features/mistakes/viewModel";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { colors, radius, spacing } from "@/theme";

export default function MistakesScreen() {
  const { mistakes } = useUserState();
  const [filter, setFilter] = useState<"unresolved" | "all">("unresolved");

  const items = useMemo(() => buildMistakeItems(mistakes, getQuestionById), [mistakes]);
  const unresolved = unresolvedItems(items);
  const shown = filter === "unresolved" ? unresolved : items;
  const top = useMemo(() => topMistakeLessons(items), [items]);

  return (
    <Screen
      footer={
        unresolved.length > 0 ? (
          <Button title={`Çözülmemiş ${unresolved.length} soruyu çöz`} icon={icons.play} size="lg" onPress={() => router.push({ pathname: "/mistakes/practice", params: { scope: "unresolved" } })} />
        ) : undefined
      }
    >
      <PageHero
        emoji="🎯"
        title="Yanlışlarım"
        subtitle="Her yanlış bir öğrenme fırsatı. Bir soruyu tekrar doğru çözersen “Çözüldü” olur; kaydı silinmez."
        color={colors.danger}
      >
        <View style={styles.summary}>
          <View style={[styles.sumBox, { backgroundColor: colors.dangerMuted }]}>
            <AppText variant="title" color="danger">{unresolved.length}</AppText>
            <AppText variant="caption" color="textSecondary">çözülmemiş</AppText>
          </View>
          <View style={[styles.sumBox, { backgroundColor: colors.successMuted }]}>
            <AppText variant="title" color="success">{items.length - unresolved.length}</AppText>
            <AppText variant="caption" color="textSecondary">çözüldü</AppText>
          </View>
        </View>
      </PageHero>

      {top.length > 0 ? (
        <Card>
          <AppText variant="label" color="danger">EN ÇOK HATA YAPTIĞIN KONULAR</AppText>
          {top.map((t) => {
            const lesson = getLessonSummary(t.lessonId);
            return (
              <View key={t.lessonId} style={styles.topRow}>
                <AppText variant="bodyStrong" style={styles.flex}>{lesson?.title ?? t.lessonId}</AppText>
                <AppText color="textSecondary">{t.count} soru</AppText>
              </View>
            );
          })}
        </Card>
      ) : null}

      <View style={styles.filters}>
        <Chip label={`Çözülmemiş (${unresolved.length})`} selected={filter === "unresolved"} onPress={() => setFilter("unresolved")} />
        <Chip label={`Tümü (${items.length})`} selected={filter === "all"} onPress={() => setFilter("all")} />
      </View>

      {shown.length === 0 ? (
        <Card>
          <AppText style={styles.emptyEmoji}>{items.length === 0 ? "✨" : "🎉"}</AppText>
          <AppText variant="subheading">{items.length === 0 ? "Henüz yanlışın yok" : "Çözülmemiş yanlışın kalmadı"}</AppText>
          <AppText color="textSecondary">
            {items.length === 0
              ? "Alıştırma ve sınavlarda yanlış yaptığın sorular burada görünür."
              : "Harika! Çözdüğün yanlışları görmek için “Tümü”ne bakabilirsin."}
          </AppText>
        </Card>
      ) : (
        shown.map((item) => (
          <MistakeCard
            key={item.record.questionId}
            item={item}
            onRetry={() => router.push({ pathname: "/mistakes/practice", params: { scope: "question", questionId: item.record.questionId } })}
            onDismiss={() => progressService.dismissMistake(item.record.questionId)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  topRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  flex: { flex: 1 },
  summary: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  sumBox: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.md },
  emptyEmoji: { fontSize: 36, lineHeight: 44 },
});
