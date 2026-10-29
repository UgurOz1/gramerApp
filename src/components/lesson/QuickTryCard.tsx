import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Card, Icon, IconBubble, icons } from "@/components/common";
import type { QuickTry } from "@/features/lesson/quickTry";
import { colors, radius, spacing } from "@/theme";

import { HighlightedText } from "./HighlightedText";

/** Kuraldan hemen sonra gelen tek soruluk mini deneme. Yanlış seçimde tekrar denenir; ilerleme kaydedilmez. */
export function QuickTryCard({ quick }: { quick: QuickTry }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);

  const choose = (i: number) => {
    if (solved || wrong.includes(i)) return;
    if (i === quick.correctIndex) setSolved(true);
    else setWrong((w) => [...w, i]);
  };

  return (
    <Card accentColor={colors.success}>
      <View style={styles.head}>
        <IconBubble icon={icons.bolt} color={colors.success} background={colors.successMuted} size={40} />
        <View style={styles.flex}>
          <AppText variant="label" style={{ color: colors.success }}>HEMEN DENE</AppText>
          <AppText variant="heading" accessibilityRole="header">Az önce öğrendiğini kullan</AppText>
        </View>
      </View>
      <AppText color="textSecondary">Türkçe anlama uyan İngilizce kısmı seç:</AppText>
      <View style={styles.prompt}>
        <AppText variant="subheading">{quick.sentence}</AppText>
        <AppText variant="caption" color="textSecondary">🇹🇷 {quick.tr}</AppText>
      </View>
      <View style={styles.options}>
        {quick.options.map((text, i) => {
          const isRight = solved && i === quick.correctIndex;
          const isWrong = wrong.includes(i);
          return (
            <Pressable
              key={text}
              onPress={() => choose(i)}
              disabled={solved || isWrong}
              accessibilityRole="button"
              accessibilityState={{ selected: isRight, disabled: solved || isWrong }}
              accessibilityLabel={`${text}${isWrong ? ", yanlış" : ""}${isRight ? ", doğru" : ""}`}
              style={({ pressed }) => [styles.option, isRight && styles.right, isWrong && styles.wrong, pressed && styles.pressed]}
            >
              <AppText style={[styles.flex, isWrong && styles.struck]} color={isRight ? "success" : isWrong ? "danger" : "text"}>{text}</AppText>
              {isRight ? <Icon name={icons.checkCircle} size={22} color={colors.success} /> : null}
              {isWrong ? <Icon name={icons.xCircle} size={22} color={colors.danger} /> : null}
            </Pressable>
          );
        })}
      </View>
      {wrong.length > 0 && !solved ? (
        <AppText variant="caption" color="warning">Henüz değil. Cümlenin Türkçesine bir daha bak ve başka bir seçenek dene.</AppText>
      ) : null}
      {solved ? (
        <View style={styles.feedback}>
          <AppText variant="bodyStrong" color="success">Doğru! 🎉</AppText>
          <HighlightedText text={quick.fullSentence} highlight={quick.correctText} />
          <AppText variant="caption" color="textSecondary">Kalıp: {quick.pattern}</AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  prompt: { gap: 4, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  options: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  right: { borderColor: colors.success, backgroundColor: colors.successMuted },
  wrong: { borderColor: colors.danger, backgroundColor: colors.dangerMuted },
  struck: { textDecorationLine: "line-through" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  feedback: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.successMuted },
});
