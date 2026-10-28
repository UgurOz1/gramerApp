import { StyleSheet, View } from "react-native";

import { AppText, Badge, Card, Icon } from "@/components/common";
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
      {comparison.structures.map((st) => (
        <Card key={st.name} style={styles.structure}>
          <Badge label={st.name.toUpperCase()} tone="accent" />
          <AppText variant="subheading">{st.meaning}</AppText>

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
              <AppText variant="bodyStrong" color="accent">{f.pattern}</AppText>
              <AppText>{f.example}</AppText>
            </View>
          ))}

          <AppText variant="label" color="textSecondary">İPUCU SÖZCÜKLER</AppText>
          <AppText>{st.signals.join("  ·  ")}</AppText>
        </Card>
      ))}

      <AppText variant="heading" accessibilityRole="header">Yan yana örnekler</AppText>
      {comparison.pairs.map((pair) => (
        <Card key={pair.left.id}>
          <ExampleItem example={pair.left} />
          <ExampleItem example={pair.right} />
          <AppText variant="caption" color="textSecondary">{pair.note}</AppText>
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
        <AppText variant="heading" accessibilityRole="header">Hangisini seçmeliyim?</AppText>
        {comparison.decisionGuide.map((g) => (
          <View key={g.question} style={styles.block}>
            <AppText variant="bodyStrong">{g.question}</AppText>
            <AppText color="textSecondary">{g.answer}</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <Badge label="DİKKAT" tone="warning" />
        <AppText variant="heading" accessibilityRole="header">Sık karıştırılan durumlar</AppText>
        {comparison.confusions.map((c) => (
          <View key={c.wrong} style={styles.block}>
            <View style={styles.row}>
              <Icon name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }} color={colors.danger} size={20} />
              <AppText style={styles.flex}>
                <AppText variant="bodyStrong" color="danger">Yanlış: </AppText>
                <AppText color="danger" style={styles.strike}>{c.wrong}</AppText>
              </AppText>
            </View>
            <View style={styles.row}>
              <Icon name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} color={colors.success} size={20} />
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

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  structure: { borderColor: colors.accent, borderWidth: 1 },
  bullet: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  form: { gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  block: { gap: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  strike: { textDecorationLine: "line-through" },
});
