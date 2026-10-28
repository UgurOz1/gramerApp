import { StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/common";
import type { Question } from "@/domain/models";
import type { Evaluation } from "@/domain/question-engine/evaluate";
import { colors, radius, spacing } from "@/theme";

type Props = { question: Question; evaluation: Evaluation };

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
      style={[styles.panel, { borderColor: accent, backgroundColor: ok ? colors.successMuted : colors.dangerMuted }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header}>
        <Icon
          name={ok ? { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" } : { ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
          color={accent}
          size={26}
        />
        <AppText variant="subheading" style={{ color: accent }}>{ok ? "Doğru!" : "Yanlış"}</AppText>
      </View>

      {!ok ? (
        <View style={styles.block}>
          <AppText variant="label" color="textSecondary">DOĞRU CEVAP</AppText>
          <AppText variant="bodyStrong">{evaluation.correctAnswer}</AppText>
          {evaluation.alternativeAnswers.length > 0 ? (
            <AppText variant="caption" color="textSecondary">
              Kabul edilen diğer cevaplar: {evaluation.alternativeAnswers.join("  ·  ")}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {evaluation.feedback ? (
        <View style={styles.block}>
          <AppText variant="label" color="textSecondary">CEVABINDAKİ SORUN</AppText>
          <AppText>{evaluation.feedback}</AppText>
        </View>
      ) : null}

      <View style={styles.block}>
        <AppText variant="label" color="textSecondary">AÇIKLAMA</AppText>
        <AppText>{question.explanation}</AppText>
        {question.type === "translation" ? (
          <AppText variant="caption" color="textSecondary">Ölçülen kural: {question.targetStructure}</AppText>
        ) : null}
      </View>

      {otherOptions.length > 0 ? (
        <View style={styles.block}>
          <AppText variant="label" color="textSecondary">DİĞER SEÇENEKLER NEDEN YANLIŞ?</AppText>
          {otherOptions.map((o) => (
            <AppText key={o.id}>
              <AppText variant="bodyStrong">{o.text}</AppText>
              {" — "}
              {question.type === "multiple_choice" ? question.optionExplanations[o.id] : ""}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  block: { gap: spacing.xs },
});
