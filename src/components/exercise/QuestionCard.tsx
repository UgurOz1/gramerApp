import { StyleSheet, View } from "react-native";

import { AppText, Badge } from "@/components/common";
import { questionTypeLabels } from "@/constants/labels";
import type { Question, QuestionType } from "@/domain/models";
import type { AnswerResponse, Evaluation } from "@/domain/question-engine/evaluate";
import { colors, radius, shadows, spacing } from "@/theme";

import { FeedbackPanel } from "./FeedbackPanel";
import { MultipleChoiceInput } from "./MultipleChoiceInput";
import { SentenceBuildingInput } from "./SentenceBuildingInput";
import { TextAnswerInput } from "./TextAnswerInput";

type Props = {
  question: Question;
  response: AnswerResponse | null;
  onChange: (response: AnswerResponse | null) => void;
  /** Doluysa soru kilitlenir ve geri bildirim gösterilir. Sınavda her zaman null. */
  evaluation: Evaluation | null;
  showHint?: boolean;
  onSubmit?: () => void;
};

const typeEmoji: Record<QuestionType, string> = {
  multiple_choice: "🔘",
  fill_blank: "✏️",
  sentence_building: "🧩",
  error_correction: "🔍",
  translation: "🌍",
};

/**
 * Tek bir soruyu çizer ve cevabı toplar. Cevabı kontrol etme ve ilerleme
 * ekranın sorumluluğundadır. Soru değiştiğinde `key={question.id}` verilmelidir.
 */
export function QuestionCard({ question, response, onChange, evaluation, showHint = true, onSubmit }: Props) {
  const locked = evaluation !== null;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Badge label={`${typeEmoji[question.type]}  ${questionTypeLabels[question.type]}`} tone="accent" />
        <QuestionBody question={question} />
        {showHint && question.hint && question.type !== "sentence_building" ? (
          <View style={styles.hint}>
            <AppText variant="caption" color="warning">💡 İpucu: {question.hint}</AppText>
          </View>
        ) : null}
      </View>

      {question.type === "multiple_choice" ? (
        <MultipleChoiceInput
          question={question}
          selectedId={response?.type === "multiple_choice" ? response.optionId : null}
          onSelect={(optionId) => onChange({ type: "multiple_choice", optionId })}
          revealed={locked}
        />
      ) : null}

      {question.type === "fill_blank" ? (
        <TextAnswerInput
          placeholder="Boşluğa gelecek sözcüğü yaz"
          accessibilityLabel="Cevabın"
          locked={locked}
          status={evaluation ? (evaluation.isCorrect ? "correct" : "wrong") : undefined}
          onSubmit={onSubmit}
          onChangeText={(text) => onChange(text.trim() ? { type: "fill_blank", text } : null)}
        />
      ) : null}

      {question.type === "sentence_building" ? (
        <SentenceBuildingInput
          question={question}
          locked={locked}
          status={evaluation ? (evaluation.isCorrect ? "correct" : "wrong") : undefined}
          onChange={(tokens) => onChange(tokens.length ? { type: "sentence_building", tokens } : null)}
        />
      ) : null}

      {question.type === "error_correction" ? (
        <TextAnswerInput
          initialValue={question.incorrectSentence}
          placeholder="Doğru cümleyi yaz"
          accessibilityLabel="Düzelttiğin cümle"
          autoCapitalize="sentences"
          locked={locked}
          status={evaluation ? (evaluation.isCorrect ? "correct" : "wrong") : undefined}
          onSubmit={onSubmit}
          onChangeText={(text) =>
            onChange(text.trim() && text !== question.incorrectSentence ? { type: "error_correction", text } : null)
          }
        />
      ) : null}

      {question.type === "translation" ? (
        <TextAnswerInput
          placeholder="İngilizce cümleni yaz"
          accessibilityLabel="İngilizce çevirin"
          autoCapitalize="sentences"
          multiline
          locked={locked}
          status={evaluation ? (evaluation.isCorrect ? "correct" : "wrong") : undefined}
          onChangeText={(text) => onChange(text.trim() ? { type: "translation", text } : null)}
        />
      ) : null}

      {evaluation ? <FeedbackPanel question={question} evaluation={evaluation} /> : null}
    </View>
  );
}

/** Soru türüne göre soru metnini gösterir. */
function QuestionBody({ question }: { question: Question }) {
  switch (question.type) {
    case "error_correction":
      return (
        <>
          <AppText color="textSecondary">{question.prompt}</AppText>
          <View style={styles.wrongSentence}>
            <AppText variant="label" color="danger">HATALI CÜMLE</AppText>
            <AppText variant="heading">{question.incorrectSentence}</AppText>
          </View>
        </>
      );
    case "translation":
      return (
        <>
          <AppText color="textSecondary">{question.prompt}</AppText>
          <View style={styles.source}>
            <AppText variant="label" color="info">🇹🇷 TÜRKÇE</AppText>
            <AppText variant="heading">{question.source}</AppText>
          </View>
        </>
      );
    case "sentence_building":
      // Türkçe karşılık sorunun kendisidir; ipucu ayarından bağımsız her zaman gösterilir.
      return (
        <>
          <AppText color="textSecondary">{question.prompt}</AppText>
          {question.hint ? (
            <View style={styles.source}>
              <AppText variant="label" color="info">🇹🇷 TÜRKÇE</AppText>
              <AppText variant="heading">{question.hint}</AppText>
            </View>
          ) : null}
        </>
      );
    default:
      return <AppText variant="title" style={styles.prompt}>{question.prompt}</AppText>;
  }
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    backgroundImage: "linear-gradient(160deg, #1E2142 0%, #141829 80%)",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.card,
  },
  prompt: { fontSize: 22, lineHeight: 30, fontWeight: "700" },
  hint: { padding: spacing.sm + 2, borderRadius: radius.sm, backgroundColor: colors.warningMuted, alignSelf: "flex-start" },
  wrongSentence: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "#6B2A3B",
  },
  source: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.infoMuted,
    borderWidth: 1,
    borderColor: "#1F4D70",
  },
});
