import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/common";
import type { Question } from "@/domain/models";
import type { Evaluation } from "@/domain/question-engine/evaluate";
import { colors, radius, spacing } from "@/theme";

type Props = { question: Question; evaluation: Evaluation };

const PRAISE = ["Harika!", "Süper!", "Mükemmel!", "Tam isabet!", "Çok iyi!", "Bravo!"];
const COMFORT = ["Olsun, öğreniyorsun!", "Az kaldı!", "Bir dahakine!", "Hatadan öğrenilir!"];

function pick(list: string[], seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

/** Cevap kontrol edildikten sonra doğru cevabı ve açıklamaları gösterir. */
export function FeedbackPanel({ question, evaluation }: Props) {
  const ok = evaluation.isCorrect;
  const accent = ok ? colors.success : colors.danger;
  const otherOptions =
    question.type === "multiple_choice"
      ? question.options.filter((o) => o.id !== question.correctOptionId)
      : [];

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: `${accent}88`,
          backgroundImage: `linear-gradient(160deg, ${ok ? colors.successMuted : colors.dangerMuted} 0%, ${colors.surface} 85%)`,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <AppText style={styles.badgeEmoji}>{ok ? "🎉" : "💪"}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" style={{ color: accent }}>{ok ? pick(PRAISE, question.id) : "Yanlış"}</AppText>
          <AppText variant="caption" color="textSecondary">{ok ? "Doğru cevap verdin." : pick(COMFORT, question.id)}</AppText>
        </View>
      </View>

      {!ok ? (
        <View style={[styles.block, styles.answerBox]}>
          <AppText variant="label" color="success">DOĞRU CEVAP</AppText>
          <AppText variant="subheading">{evaluation.correctAnswer}</AppText>
          {evaluation.alternativeAnswers.length > 0 ? (
            <AppText variant="caption" color="textSecondary">
              Kabul edilen diğer cevaplar: {evaluation.alternativeAnswers.join("  ·  ")}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {evaluation.feedback ? (
        <View style={styles.block}>
          <AppText variant="label" color="warning">⚠️ CEVABINDAKİ SORUN</AppText>
          <AppText>{evaluation.feedback}</AppText>
        </View>
      ) : null}

      <View style={styles.block}>
        <AppText variant="label" color="accent">📘 AÇIKLAMA</AppText>
        <AppText style={styles.lh}>{question.explanation}</AppText>
        {question.type === "translation" ? (
          <AppText variant="caption" color="textSecondary">Ölçülen kural: {question.targetStructure}</AppText>
        ) : null}
      </View>

      {otherOptions.length > 0 ? (
        <View style={styles.block}>
          <AppText variant="label" color="textSecondary">DİĞER SEÇENEKLER NEDEN YANLIŞ?</AppText>
          {otherOptions.map((o) => (
            <View key={o.id} style={styles.other}>
              <AppText variant="bodyStrong" color="danger">✕ {o.text}</AppText>
              <AppText variant="caption" color="textSecondary">
                {question.type === "multiple_choice" ? question.optionExplanations[o.id] : ""}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  badge: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  badgeEmoji: { fontSize: 24, lineHeight: 30 },
  block: { gap: spacing.xs },
  answerBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.successMuted },
  lh: { lineHeight: 25 },
  other: { gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
});
