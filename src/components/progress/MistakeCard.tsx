import { router } from "expo-router";

import { lessonHref } from "@/features/curriculum/routes";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon, icons } from "@/components/common";
import { questionTypeLabels } from "@/constants/labels";
import { describeCorrectAnswer } from "@/domain/question-engine/evaluate";
import type { Question } from "@/domain/models";
import type { MistakeItem } from "@/features/mistakes/viewModel";
import { getLessonSummary } from "@/features/curriculum/catalog";
import { colors, spacing } from "@/theme";
import { formatDate } from "@/utils/date";

function questionText(q: Question): string {
  switch (q.type) {
    case "error_correction":
      return `Hatalı cümle: ${q.incorrectSentence}`;
    case "translation":
      return q.source;
    case "sentence_building":
      return q.hint ?? q.prompt;
    default:
      return q.prompt;
  }
}

type Props = {
  item: MistakeItem;
  onRetry: () => void;
  onDismiss: () => void;
};

export function MistakeCard({ item, onRetry, onDismiss }: Props) {
  const { record, question } = item;
  const [open, setOpen] = useState(false);
  const lesson = getLessonSummary(record.lessonId);
  const correct = describeCorrectAnswer(question);

  return (
    <Card accentColor={record.resolved ? colors.success : colors.danger}>
      <View style={styles.head}>
        <Icon
          name={record.resolved ? { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" } : { ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
          color={record.resolved ? colors.success : colors.danger}
          size={22}
        />
        <AppText variant="bodyStrong" color={record.resolved ? "success" : "danger"}>
          {record.resolved ? "Çözüldü" : "Çözülmedi"}
        </AppText>
        <Badge label={questionTypeLabels[question.type]} />
      </View>

      <AppText variant="subheading">{questionText(question)}</AppText>
      <View style={styles.answers}>
        <View style={[styles.answer, { backgroundColor: colors.dangerMuted }]}>
          <AppText variant="label" color="danger">SENİN CEVABIN</AppText>
          <AppText color="danger" style={styles.strike}>{record.lastWrongAnswer || "—"}</AppText>
        </View>
        <View style={[styles.answer, { backgroundColor: colors.successMuted }]}>
          <AppText variant="label" color="success">DOĞRU CEVAP</AppText>
          <AppText variant="bodyStrong" color="success">{correct.correctAnswer}</AppText>
        </View>
      </View>

      <View style={styles.meta}>
        {lesson ? <Badge label={lesson.title} tone="accent" /> : null}
        <Badge label={`${record.wrongCount} kez yanlış`} />
        <Badge label={`Son: ${formatDate(record.lastAnsweredAt)}`} />
      </View>

      {open ? (
        <View style={styles.explain}>
          <AppText variant="label" color="textSecondary">AÇIKLAMA</AppText>
          <AppText>{question.explanation}</AppText>
          {correct.alternativeAnswers.length > 0 ? (
            <AppText variant="caption" color="textSecondary">Kabul edilen diğer cevaplar: {correct.alternativeAnswers.join("  ·  ")}</AppText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}><Button title="Tekrar çöz" icon={icons.replay} onPress={onRetry} /></View>
        <View style={styles.action}><Button title={open ? "Açıklamayı gizle" : "Açıklamayı gör"} variant="secondary" onPress={() => setOpen((o) => !o)} /></View>
      </View>
      <View style={styles.actions}>
        {lesson ? (
          <View style={styles.action}>
            <Button title="Dersi aç" variant="ghost" onPress={() => router.push(lessonHref(record.lessonId))} />
          </View>
        ) : null}
        <View style={styles.action}><Button title="Listeden kaldır" variant="ghost" onPress={onDismiss} accessibilityHint="Geçmiş cevaplar ve sınav sonuçları silinmez" /></View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  explain: { gap: spacing.xs, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  actions: { flexDirection: "row", gap: spacing.sm },
  answers: { gap: spacing.xs },
  answer: { gap: 2, padding: spacing.md, borderRadius: 12 },
  strike: { textDecorationLine: "line-through" },
  action: { flex: 1 },
});
