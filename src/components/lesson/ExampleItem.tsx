import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/common";
import type { ExampleSentence } from "@/domain/models";
import { colors, spacing } from "@/theme";

import { HighlightedText } from "./HighlightedText";

export function ExampleItem({ example }: { example: ExampleSentence }) {
  return (
    <View style={styles.item} accessible accessibilityLabel={`${example.en}. Türkçesi: ${example.tr}`}>
      <HighlightedText text={example.en} highlight={example.highlight} />
      <AppText color="textSecondary">{example.tr}</AppText>
      {example.note ? <AppText variant="caption" color="textMuted">{example.note}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: 2,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
});
