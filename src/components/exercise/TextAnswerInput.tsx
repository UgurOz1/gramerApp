import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  initialValue?: string;
  placeholder: string;
  accessibilityLabel: string;
  multiline?: boolean;
  /** "none": boşluk doldurmada ilk harfi otomatik büyütme. */
  autoCapitalize?: "none" | "sentences";
  locked: boolean;
  /** Kontrol sonrası çerçeve rengi. */
  status?: "correct" | "wrong";
  /** Kullanıcı yazdıkça çağrılır. */
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
};

export function TextAnswerInput({
  initialValue = "",
  placeholder,
  accessibilityLabel,
  multiline,
  autoCapitalize = "none",
  locked,
  status,
  onChangeText,
  onSubmit,
}: Props) {
  const [text, setText] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChangeText(t);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      editable={!locked}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      accessibilityLabel={accessibilityLabel}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      spellCheck={false}
      multiline={multiline}
      returnKeyType={multiline ? "default" : "done"}
      onSubmitEditing={multiline ? undefined : onSubmit}
      blurOnSubmit={!multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        focused && !locked && styles.focused,
        status === "correct" && styles.correct,
        status === "wrong" && styles.wrong,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.subheading,
    fontWeight: "600",
    minHeight: 60,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    outlineWidth: 0,
    outlineColor: "transparent",
  },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  focused: { borderColor: colors.accent, boxShadow: "0px 0px 0px 4px rgba(142,131,255,0.18)" },
  correct: { borderColor: colors.success, backgroundColor: colors.successMuted },
  wrong: { borderColor: colors.danger, backgroundColor: colors.dangerMuted },
});
