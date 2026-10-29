import { router } from "expo-router";

import { lessonHref } from "@/features/curriculum/routes";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, PageHero, Screen, SectionHeader, icons } from "@/components/common";
import { masteryBandLabels } from "@/constants/labels";
import { getAvailableLessonIds, getLessonContent } from "@/data/contentRepository";
import { getLessonStatus, lessonStatusLabels } from "@/domain/progress/lessonStatus";
import { getLessonSummary, isLessonAvailable } from "@/features/curriculum/catalog";
import { useMastery } from "@/features/progress/useMastery";
import { progressService } from "@/services/progress/progressService";
import { useUserState } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";
import { formatDate } from "@/utils/date";

export default function ReviewScreen() {
  const { reviewList, lessonProgress, examResults } = useUserState();
  const mastery = useMastery();

  const listed = new Set(reviewList.map((r) => r.lessonId));
  const candidates = getAvailableLessonIds().filter((id) => !listed.has(id));
  const history = [...examResults].reverse().slice(0, 10);
  const listedAvailable = reviewList.filter((r) => isLessonAvailable(r.lessonId));

  return (
    <Screen>
      <PageHero
        emoji="🔖"
        title="Tekrar listem"
        subtitle="Tekrar etmek istediğin konular. Liste yalnızca senin seçtiklerinden oluşur ve yanlışlar listesinden ayrıdır."
        color={colors.warning}
      />

      <SectionHeader title="Listendeki konular" subtitle={reviewList.length ? `${reviewList.length} konu` : undefined} />
      {reviewList.length === 0 ? (
        <Card>
          <AppText style={{ fontSize: 36, lineHeight: 44 }}>📭</AppText>
          <AppText variant="subheading">Listen boş</AppText>
          <AppText color="textSecondary">Aşağıdan bir konu ekleyebilir ya da ders ekranındaki “Tekrar listeme ekle” butonunu kullanabilirsin.</AppText>
        </Card>
      ) : (
        <>
          {reviewList.map((item) => {
            const summary = getLessonSummary(item.lessonId);
            const m = mastery[item.lessonId];
            const status = getLessonStatus(lessonProgress[item.lessonId], m);
            return (
              <Card key={item.lessonId} accentColor={colors.warning}>
                <AppText variant="subheading">{summary?.title ?? item.lessonId}</AppText>
                <View style={styles.badges}>
                  <Badge label={lessonStatusLabels[status]} tone="accent" />
                  {m && m.band !== "not_enough_data" ? <Badge label={`Ustalık: ${masteryBandLabels[m.band]} (${m.score})`} /> : null}
                  <Badge label={`Eklendi: ${formatDate(item.addedAt)}`} />
                </View>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Button title="Dersi aç" icon={icons.book} onPress={() => router.push(lessonHref(item.lessonId))} disabled={!isLessonAvailable(item.lessonId)} />
                  </View>
                  <View style={styles.flex}>
                    <Button title="Listeden çıkar" variant="secondary" onPress={() => progressService.removeFromReviewList(item.lessonId)} />
                  </View>
                </View>
              </Card>
            );
          })}
          {listedAvailable.length > 0 ? (
            <Button
              title="Bu konulardan karışık test oluştur"
              icon={icons.shuffle}
              variant="secondary"
              onPress={() => router.push({ pathname: "/mixed", params: { scope: "review" } })}
            />
          ) : null}
        </>
      )}

      <SectionHeader title="Konu ekle" />
      {candidates.length === 0 ? (
        <AppText color="textSecondary">Eklenebilecek başka konu yok.</AppText>
      ) : (
        <Card>
          {candidates.map((id) => (
            <View key={id} style={styles.addRow}>
              <AppText variant="bodyStrong" style={styles.flex}>{getLessonSummary(id)?.title ?? id}</AppText>
              <Button title="Ekle" icon={icons.bookmarkAdd} variant="secondary" onPress={() => progressService.addToReviewList(id)} />
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title="Sınav geçmişi" subtitle="Daha önce çözdüğün sınavlar. Yeniden çözmek eski sonuçlarını değiştirmez." />
      {history.length === 0 ? (
        <AppText color="textSecondary">Henüz sınav çözmedin.</AppText>
      ) : (
        <Card>
          {history.map((r) => {
            const lesson = r.kind === "lesson" && r.lessonId ? getLessonContent(r.lessonId) : null;
            return (
              <View key={r.resultId} style={styles.addRow}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{lesson ? lesson.exam.title : "Karışık test"}</AppText>
                  <View style={styles.badges}>
                    <Badge label={`%${r.percent}`} tone={r.percent >= 70 ? "success" : "warning"} />
                    <AppText variant="caption" color="textSecondary">{formatDate(r.finishedAt)} · {r.correct}/{r.total}</AppText>
                  </View>
                </View>
                <Button
                  title="Yeniden çöz"
                  icon={icons.replay}
                  variant="secondary"
                  onPress={() => (lesson ? router.push({ pathname: "/exam/[lessonId]", params: { lessonId: lesson.id } }) : router.push("/mixed"))}
                />
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
});
