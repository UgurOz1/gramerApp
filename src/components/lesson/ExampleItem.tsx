import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/common";
import type { ExampleSentence } from "@/domain/models";
import { colors, radius, spacing } from "@/theme";

import { HighlightedText } from "./HighlightedText";

type Props = {
  example: ExampleSentence;
  /** Türkçesi dokununca açılır: önce kendin çevirmeyi dene (aktif hatırlama). */
  reveal?: boolean;
};

export function ExampleItem({ example, reveal }: Props) {
  const [shown, setShown] = useState(!reveal);
  const Wrapper = reveal && !shown ? Pressable : View;
  return (
    <Wrapper
      style={styles.item}
      accessible
      accessibilityLabel={shown ? `${example.en}. Türkçesi: ${example.tr}` : `${example.en}. Türkçesini görmek için dokun`}
      {...(reveal && !shown ? { onPress: () => setShown(true), accessibilityRole: "button" as const } : {})}
    >
      <View style={styles.flag}>
        <AppText style={styles.flagText}>EN</AppText>
      </View>
      <View style={styles.body}>
        <HighlightedText text={example.en} highlight={example.highlight} />
        {shown ? (
          <AppText variant="caption" color="textSecondary" style={styles.tr}>🇹🇷 {example.tr}</AppText>
        ) : (
          <AppText variant="caption" color="accent" style={styles.tr}>👆 Önce kendin çevir, sonra dokunup Türkçesini gör</AppText>
        )}
        {shown && example.note ? (
          <View style={styles.note}>
            <AppText variant="caption" color="warning">💡 {example.note}</AppText>
          </View>
        ) : null}
      </View>
    </Wrapper>
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
