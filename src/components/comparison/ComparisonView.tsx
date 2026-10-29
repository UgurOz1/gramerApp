import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, icons } from "@/components/common";
import { ExampleItem } from "@/components/lesson/ExampleItem";
import type { Comparison } from "@/domain/models";
import { colors, radius, spacing } from "@/theme";

/** Karşılaştırma içeriğini bölümler hâlinde çizer. */
export function ComparisonView({ comparison }: { comparison: Comparison }) {
  return (
    <View style={styles.stack}>
      <Card>
        <AppText variant="subheading">Bu karşılaştırmada öğreneceklerin</AppText>
        {comparison.objectives.map((o) => (
          <View key={o} style={styles.bullet}>
            <AppText color="accent">•</AppText>
            <AppText style={styles.flex}>{o}</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="heading" accessibilityRole="header">Neden karıştırılıyor?</AppText>
        {comparison.intro.map((p, i) => <AppText key={i}>{p}</AppText>)}
      </Card>

      <AppText variant="heading" accessibilityRole="header">Her yapının temel anlamı</AppText>
      {comparison.structures.map((st, i) => {
        const c = STRUCTURE_COLORS[i % STRUCTURE_COLORS.length];
        return (
        <Card key={st.name} style={[styles.structure, { borderColor: `${c.fg}66`, backgroundImage: `linear-gradient(160deg, ${c.bg} 0%, ${colors.surface} 70%)` }]}>
          <View style={[styles.structName, { backgroundColor: c.bg }]}>
            <AppText variant="label" style={{ color: c.fg }}>{i === 0 ? "A" : "B"} · {st.name.toUpperCase()}</AppText>
          </View>
          <AppText variant="heading">{st.meaning}</AppText>

          <AppText variant="label" color="textSecondary">KULLANIM ALANLARI</AppText>
          {st.usage.map((u) => (
            <View key={u} style={styles.bullet}>
              <AppText color="accent">•</AppText>
              <AppText style={styles.flex}>{u}</AppText>
            </View>
          ))}

          <AppText variant="label" color="textSecondary">CÜMLE YAPISI</AppText>
          {st.forms.map((f) => (
            <View key={f.label} style={styles.form}>
              <AppText variant="caption" color="textSecondary">{f.label}</AppText>
              <AppText variant="bodyStrong" style={{ color: c.fg }}>{f.pattern}</AppText>
              <AppText>{f.example}</AppText>
            </View>
          ))}

          <AppText variant="label" color="textSecondary">İPUCU SÖZCÜKLER</AppText>
          <View style={styles.signals}>
            {st.signals.map((sig) => (
              <View key={sig} style={[styles.signal, { borderColor: `${c.fg}66` }]}>
                <AppText variant="caption" style={{ color: c.fg, fontWeight: "700" }}>{sig}</AppText>
              </View>
            ))}
          </View>
        </Card>
        );
      })}

      <AppText variant="heading" accessibilityRole="header">Yan yana örnekler</AppText>
      {comparison.pairs.map((pair) => (
        <Card key={pair.left.id}>
          <ExampleItem example={pair.left} />
          <AppText variant="caption" color="textMuted" style={styles.vs}>— karşılaştır —</AppText>
          <ExampleItem example={pair.right} />
          <AppText variant="caption" color="warning">💡 {pair.note}</AppText>
        </Card>
      ))}

      <Card>
        <AppText variant="heading" accessibilityRole="header">Türkçe anlam farkı</AppText>
        {comparison.meaningDifference.map((d) => (
          <View key={d.heading} style={styles.block}>
            <AppText variant="subheading">{d.heading}</AppText>
            <AppText>{d.body}</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="label" color="accent">🧭 KARAR REHBERİ</AppText>
        <AppText variant="heading" accessibilityRole="header">Hangisini seçmeliyim?</AppText>
        {comparison.decisionGuide.map((g) => (
          <View key={g.question} style={styles.block}>
            <AppText variant="bodyStrong">{g.question}</AppText>
            <AppText color="textSecondary">{g.answer}</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="label" color="danger">⚠️ DİKKAT</AppText>
        <AppText variant="heading" accessibilityRole="header">Sık karıştırılan durumlar</AppText>
        {comparison.confusions.map((c) => (
          <View key={c.wrong} style={styles.block}>
            <View style={styles.row}>
              <Icon name={icons.xCircle} color={colors.danger} size={20} />
              <AppText style={styles.flex}>
                <AppText variant="bodyStrong" color="danger">Yanlış: </AppText>
                <AppText color="danger" style={styles.strike}>{c.wrong}</AppText>
              </AppText>
            </View>
            <View style={styles.row}>
              <Icon name={icons.checkCircle} color={colors.success} size={20} />
              <AppText style={styles.flex}>
                <AppText variant="bodyStrong" color="success">Doğru: </AppText>
                <AppText color="success">{c.right}</AppText>
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary">{c.explanation}</AppText>
          </View>
        ))}
      </Card>
    </View>
  );
}

const STRUCTURE_COLORS = [
  { fg: colors.info, bg: colors.infoMuted },
  { fg: colors.accent, bg: colors.accentMuted },
];

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  structure: { borderWidth: 1 },
  structName: { alignSelf: "flex-start", paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: 999 },
  signals: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  signal: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  vs: { textAlign: "center" },
  bullet: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  form: { gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  block: { gap: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  strike: { textDecorationLine: "line-through" },
});
