import { StyleSheet, View } from "react-native";

import { AppText, ProgressBar } from "@/components/common";
import { colors, gradients, radius, shadows, spacing } from "@/theme";

type Props = {
  correct: number;
  wrong: number;
  skipped: number;
  title?: string;
};

function verdict(rate: number | null) {
  if (rate === null) return { emoji: "🤔", title: "Tur bitti", text: "Hiç soru cevaplamadın. Bir dahaki sefere dene!" };
  if (rate >= 0.9) return { emoji: "🏆", title: "Muhteşem!", text: "Bu konuya hâkimsin. Sınavla kendini kanıtla!" };
  if (rate >= 0.7) return { emoji: "🌟", title: "Çok iyi!", text: "Sağlam gidiyorsun. Yanlışlarına bir göz at, tamamdır." };
  if (rate >= 0.5) return { emoji: "💪", title: "İyi gidiyorsun", text: "Biraz daha pratikle oturacak. Yanlışlarını tekrar çöz." };
  return { emoji: "🌱", title: "Öğrenme yolundasın", text: "Kuralı bir kez daha oku, sonra yanlışları tekrar dene." };
}

/** Tur sonu kutlama ve sonuç kartı. */
export function RoundSummary({ correct, wrong, skipped, title }: Props) {
  const answered = correct + wrong;
  const rate = answered ? correct / answered : null;
  const v = verdict(rate);
  return (
    <View style={styles.hero}>
      <View style={styles.orb} />
      <AppText style={styles.emoji}>{v.emoji}</AppText>
      <AppText variant="display" style={styles.center} accessibilityRole="header">{title ?? v.title}</AppText>
      <AppText color="textSecondary" style={styles.center}>{v.text}</AppText>
      {rate !== null ? (
        <View style={styles.rate}>
          <AppText variant="display" style={{ color: rate >= 0.7 ? colors.success : rate >= 0.5 ? colors.warning : colors.danger }}>
            %{Math.round(rate * 100)}
          </AppText>
          <AppText variant="caption" color="textSecondary">doğruluk</AppText>
        </View>
      ) : null}
      {rate !== null ? (
        <View style={styles.full}>
          <ProgressBar value={rate} height={12} color={rate >= 0.7 ? gradients.success : gradients.warm} accessibilityLabel="Doğruluk oranı" />
        </View>
      ) : null}
      <View style={styles.stats}>
        <Stat value={correct} label="Doğru" color={colors.success} bg={colors.successMuted} />
        <Stat value={wrong} label="Yanlış" color={colors.danger} bg={colors.dangerMuted} />
        <Stat value={skipped} label="Atlanan" color={colors.textSecondary} bg={colors.surfaceAlt} />
      </View>
    </View>
  );
}

function Stat({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title" style={{ color }}>{value}</AppText>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    backgroundImage: gradients.hero,
    borderWidth: 1,
    borderColor: "#4A3FB5",
    boxShadow: shadows.raised,
  },
  orb: {
    position: "absolute",
    width: 320,
    height: 320,
    top: -160,
    backgroundImage: "radial-gradient(circle, rgba(255,200,97,0.35) 0%, transparent 70%)",
  },
  emoji: { fontSize: 72, lineHeight: 84 },
  center: { textAlign: "center" },
  rate: { alignItems: "center" },
  full: { alignSelf: "stretch" },
  stats: { flexDirection: "row", gap: spacing.sm, alignSelf: "stretch", marginTop: spacing.sm },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.md },
});
