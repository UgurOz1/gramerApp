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
  onChangeText,
  onSubmit,
}: Props) {
  const [text, setText] = useState(initialValue);
  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChangeText(t);
      }}
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
      style={[styles.input, multiline && styles.multiline, locked && styles.locked]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  locked: { opacity: 0.7 },
});
