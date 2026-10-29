import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon, icons } from "@/components/common";
import type { MultipleChoiceQuestion } from "@/domain/models";
import { colors, gradients, minTouchSize, radius, spacing } from "@/theme";

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
        const dim = revealed && !showCorrect && !showWrong;
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
              dim && styles.dim,
              pressed && !revealed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.marker,
                selected && !revealed && styles.markerSelected,
                showCorrect && { backgroundColor: colors.success },
                showWrong && { backgroundColor: colors.danger },
              ]}
            >
              {showCorrect ? (
                <Icon name={icons.check} color="#05261A" size={16} />
              ) : showWrong ? (
                <AppText variant="bodyStrong" style={styles.markerOn}>✕</AppText>
              ) : (
                <AppText variant="bodyStrong" style={selected && !revealed ? styles.markerOn : styles.markerOff}>
                  {option.id.toUpperCase()}
                </AppText>
              )}
            </View>
            <AppText variant="bodyStrong" style={styles.text}>{option.text}</AppText>
            {showCorrect ? <AppText variant="caption" color="success">Doğru</AppText> : null}
            {showWrong ? <AppText variant="caption" color="danger">Yanlış</AppText> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
  option: {
    minHeight: minTouchSize + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    boxShadow: "0px 3px 0px rgba(0,0,0,0.35)",
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentMuted, boxShadow: "0px 3px 0px #4B42B8" },
  correct: { borderColor: colors.success, backgroundColor: colors.successMuted, boxShadow: "0px 3px 0px #0E6B47" },
  wrong: { borderColor: colors.danger, backgroundColor: colors.dangerMuted, boxShadow: "0px 3px 0px #7A2436" },
  dim: { opacity: 0.5 },
  pressed: { transform: [{ translateY: 2 }], boxShadow: "0px 1px 0px rgba(0,0,0,0.35)" },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  markerSelected: { backgroundColor: colors.accentStrong, backgroundImage: gradients.primary },
  markerOn: { color: "#FFFFFF" },
  markerOff: { color: colors.textSecondary },
  text: { flex: 1 },
});
