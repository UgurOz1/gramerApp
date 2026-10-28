import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/common";
import type { MultipleChoiceQuestion } from "@/domain/models";
import { colors, minTouchSize, radius, spacing } from "@/theme";

type Props = {
  question: MultipleChoiceQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  /** Cevap kontrol edildiyse doğru/yanlış durumları gösterilir ve seçim kilitlenir. */
  revealed: boolean;
};

export function MultipleChoiceInput({ question, selectedId, onSelect, revealed }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {question.options.map((option) => {
        const selected = option.id === selectedId;
        const isCorrect = option.id === question.correctOptionId;
        const showCorrect = revealed && isCorrect;
        const showWrong = revealed && selected && !isCorrect;
        const status = showCorrect ? "Doğru cevap" : showWrong ? "Senin cevabın, yanlış" : undefined;
        return (
          <Pressable
            key={option.id}
            disabled={revealed}
            onPress={() => onSelect(option.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: revealed }}
            accessibilityLabel={status ? `${option.text}. ${status}` : option.text}
            style={({ pressed }) => [
              styles.option,
              selected && !revealed && styles.selected,
              showCorrect && styles.correct,
              showWrong && styles.wrong,
              pressed && !revealed && styles.pressed,
            ]}
          >
            <View style={[styles.marker, selected && !revealed && styles.markerSelected]}>
              <AppText variant="caption" color={selected && !revealed ? "onAccent" : "textSecondary"}>
                {option.id.toUpperCase()}
              </AppText>
            </View>
            <AppText style={styles.text}>{option.text}</AppText>
            {showCorrect ? (
              <View style={styles.status}>
                <Icon name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} color={colors.success} size={22} />
                <AppText variant="caption" color="success">Doğru</AppText>
              </View>
            ) : null}
            {showWrong ? (
              <View style={styles.status}>
                <Icon name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }} color={colors.danger} size={22} />
                <AppText variant="caption" color="danger">Yanlış</AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  option: {
    minHeight: minTouchSize + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  correct: { borderColor: colors.success, backgroundColor: colors.successMuted },
  wrong: { borderColor: colors.danger, backgroundColor: colors.dangerMuted },
  pressed: { opacity: 0.85 },
  marker: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  markerSelected: { backgroundColor: colors.accent },
  text: { flex: 1 },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
