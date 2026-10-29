import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/common";
import type { ExampleSentence } from "@/domain/models";
import { colors, radius, spacing } from "@/theme";

import { HighlightedText } from "./HighlightedText";

export function ExampleItem({ example }: { example: ExampleSentence }) {
  return (
    <View style={styles.item} accessible accessibilityLabel={`${example.en}. Türkçesi: ${example.tr}`}>
      <View style={styles.flag}>
        <AppText style={styles.flagText}>EN</AppText>
      </View>
      <View style={styles.body}>
        <HighlightedText text={example.en} highlight={example.highlight} />
        <AppText variant="caption" color="textSecondary" style={styles.tr}>🇹🇷 {example.tr}</AppText>
        {example.note ? (
          <View style={styles.note}>
            <AppText variant="caption" color="warning">💡 {example.note}</AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  flag: {
    width: 30,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  flagText: { fontSize: 10, lineHeight: 12, fontWeight: "900", color: colors.accent, letterSpacing: 0.5 },
  body: { flex: 1, gap: 4 },
  tr: { fontSize: 14, lineHeight: 20 },
  note: { alignSelf: "flex-start", marginTop: 2 },
});
