import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Chip, Screen } from "@/components/common";
import { MistakeCard } from "@/components/progress/MistakeCard";
import { getQuestionById } from "@/data/contentRepository";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { buildMistakeItems, topMistakeLessons, unresolvedItems } from "@/features/mistakes/viewModel";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { spacing } from "@/theme";

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
          <Button title={`Çözülmemiş ${unresolved.length} soruyu çöz`} onPress={() => router.push({ pathname: "/mistakes/practice", params: { scope: "unresolved" } })} />
        ) : undefined
      }
    >
      <AppText color="textSecondary">
        Yanlış yaptığın sorular burada tutulur. Bir soruyu tekrar doğru çözersen “Çözüldü” olur; kaydı silinmez. Listeden kaldırmak geçmiş sınav sonuçlarını silmez.
      </AppText>

      <Card>
        <AppText variant="subheading">Özet</AppText>
        <AppText>Çözülmemiş: {unresolved.length}</AppText>
        <AppText>Çözüldü: {items.length - unresolved.length}</AppText>
      </Card>

      {top.length > 0 ? (
        <Card>
          <AppText variant="subheading">En çok hata yaptığın konular</AppText>
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
});
