import { StyleSheet, View } from "react-native";

import { AppText, Badge, Card } from "@/components/common";
import { questionTypeLabels } from "@/constants/labels";
import type { Question } from "@/domain/models";
import type { AnswerResponse, Evaluation } from "@/domain/question-engine/evaluate";
import { colors, radius, spacing } from "@/theme";

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

/**
 * Tek bir soruyu çizer ve cevabı toplar. Cevabı kontrol etme ve ilerleme
 * ekranın sorumluluğundadır. Soru değiştiğinde `key={question.id}` verilmelidir.
 */
export function QuestionCard({ question, response, onChange, evaluation, showHint = true, onSubmit }: Props) {
  const locked = evaluation !== null;

  return (
    <View style={styles.wrap}>
      <Card>
        <Badge label={questionTypeLabels[question.type]} tone="accent" />
        <QuestionBody question={question} />
        {showHint && question.hint && question.type !== "sentence_building" ? (
          <AppText variant="caption" color="textSecondary">İpucu: {question.hint}</AppText>
        ) : null}
      </Card>

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
          onSubmit={onSubmit}
          onChangeText={(text) => onChange(text.trim() ? { type: "fill_blank", text } : null)}
        />
      ) : null}

      {question.type === "sentence_building" ? (
        <SentenceBuildingInput
          question={question}
          locked={locked}
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
            <AppText variant="subheading">{question.incorrectSentence}</AppText>
          </View>
        </>
      );
    case "translation":
      return (
        <>
          <AppText color="textSecondary">{question.prompt}</AppText>
          <AppText variant="subheading">{question.source}</AppText>
        </>
      );
    case "sentence_building":
      // Türkçe karşılık sorunun kendisidir; ipucu ayarından bağımsız her zaman gösterilir.
      return (
        <>
          <AppText color="textSecondary">{question.prompt}</AppText>
          {question.hint ? <AppText variant="subheading">{question.hint}</AppText> : null}
        </>
      );
    default:
      return <AppText variant="subheading">{question.prompt}</AppText>;
  }
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  wrongSentence: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
  },
});
