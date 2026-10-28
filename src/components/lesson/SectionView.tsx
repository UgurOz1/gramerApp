import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Icon } from "@/components/common";
import { getLessonSummary, isLessonAvailable } from "@/features/curriculum/catalog";
import type { LessonContent, LessonSection } from "@/domain/models";
import { colors, radius, spacing } from "@/theme";

import { ExampleItem } from "./ExampleItem";
import { InlineCheck } from "./InlineCheck";

type Props = {
  section: LessonSection;
  lesson: LessonContent;
  sessionId: string;
  showHint: boolean;
};

export function SectionView({ section, lesson, sessionId, showHint }: Props) {
  const examples = (ids: string[] = []) =>
    ids.map((id) => lesson.examples.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e);

  const renderExamples = (ids?: string[]) =>
    examples(ids).map((e) => <ExampleItem key={e.id} example={e} />);

  switch (section.type) {
    case "intro":
      return (
        <Card>
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.paragraphs.map((p, i) => <AppText key={i}>{p}</AppText>)}
        </Card>
      );

    case "rule":
      return (
        <Card style={styles.ruleCard}>
          <Badge label="KURAL" tone="accent" />
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.paragraphs.map((p, i) => <AppText key={i}>{p}</AppText>)}
          {section.formulas?.map((f) => (
            <View key={f.label} style={styles.formulaGroup}>
              <AppText variant="caption" color="textSecondary">{f.label}</AppText>
              <View style={styles.formula}><AppText variant="subheading" color="accent">{f.pattern}</AppText></View>
              {renderExamples(f.exampleIds)}
            </View>
          ))}
        </Card>
      );

    case "forms":
      return (
        <View style={styles.stack}>
          <Card>
            <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
            {section.paragraphs?.map((p, i) => <AppText key={i}>{p}</AppText>)}
          </Card>
          {section.forms.map((f) => (
            <Card key={f.label}>
              <Badge label={f.label.toUpperCase()} tone="accent" />
              <View style={styles.formula}><AppText variant="subheading" color="accent">{f.formula}</AppText></View>
              {renderExamples(f.exampleIds)}
              {f.note ? <AppText variant="caption" color="textSecondary">{f.note}</AppText> : null}
            </Card>
          ))}
        </View>
      );

    case "examples":
      return (
        <Card>
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.paragraphs?.map((p, i) => <AppText key={i} color="textSecondary">{p}</AppText>)}
          <View style={styles.exampleList}>{renderExamples(section.exampleIds)}</View>
        </Card>
      );

    case "usage":
      return (
        <Card>
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.paragraphs?.map((p, i) => <AppText key={i}>{p}</AppText>)}
          {section.items.map((item) => (
            <View key={item.heading} style={styles.usageItem}>
              <AppText variant="subheading">{item.heading}</AppText>
              <AppText>{item.body}</AppText>
              {renderExamples(item.exampleIds)}
            </View>
          ))}
        </Card>
      );

    case "mistakes":
      return (
        <Card>
          <Badge label="DİKKAT" tone="warning" />
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.items.map((item) => (
            <View key={item.wrong} style={styles.mistake}>
              <View style={styles.mistakeRow}>
                <Icon name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }} color={colors.danger} size={20} />
                <AppText color="danger" style={styles.mistakeText}>
                  <AppText variant="bodyStrong" color="danger">Yanlış: </AppText>
                  <AppText color="danger" style={styles.strike}>{item.wrong}</AppText>
                </AppText>
              </View>
              <View style={styles.mistakeRow}>
                <Icon name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} color={colors.success} size={20} />
                <AppText color="success" style={styles.mistakeText}>
                  <AppText variant="bodyStrong" color="success">Doğru: </AppText>
                  {item.right}
                </AppText>
              </View>
              <AppText variant="caption" color="textSecondary">{item.explanation}</AppText>
            </View>
          ))}
        </Card>
      );

    case "confusions":
      return (
        <Card>
          <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
          {section.items.map((item) => {
            const related = item.lessonId ? getLessonSummary(item.lessonId) : undefined;
            return (
              <View key={item.topic} style={styles.usageItem}>
                <AppText variant="subheading">{item.topic}</AppText>
                <AppText>{item.body}</AppText>
                {related && item.lessonId && isLessonAvailable(item.lessonId) ? (
                  <Button
                    title={`Dersi aç: ${related.title}`}
                    variant="secondary"
                    onPress={() => router.push({ pathname: "/lesson/[lessonId]", params: { lessonId: item.lessonId! } })}
                  />
                ) : related ? (
                  <AppText variant="caption" color="textMuted">İlgili ders: {related.title} (yakında)</AppText>
                ) : null}
              </View>
            );
          })}
        </Card>
      );

    case "notes": {
      const warn = section.tone === "warning";
      return (
        <View style={[styles.note, { borderColor: warn ? colors.warning : colors.accent, backgroundColor: warn ? colors.warningMuted : colors.accentMuted }]}>
          <View style={styles.mistakeRow}>
            <Icon
              name={warn ? { ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" } : { ios: "info.circle.fill", android: "info", web: "info" }}
              color={warn ? colors.warning : colors.accent}
              size={22}
            />
            <AppText variant="subheading" accessibilityRole="header">{section.title}</AppText>
          </View>
          {section.items.map((item, i) => (
            <View key={i} style={styles.bullet}>
              <AppText>•</AppText>
              <AppText style={styles.mistakeText}>{item}</AppText>
            </View>
          ))}
        </View>
      );
    }

    case "check":
      return (
        <View style={styles.stack}>
          <Card>
            <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
            <AppText color="textSecondary">Öğrendiklerini hemen dene. Cevabın kaydedilir ama sınav sonucunu etkilemez.</AppText>
          </Card>
          {section.questionIds.map((id) => {
            const q = lesson.exercises.find((x) => x.id === id);
            return q ? <InlineCheck key={id} question={q} sessionId={sessionId} showHint={showHint} /> : null;
          })}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  ruleCard: { borderColor: colors.accent, borderWidth: 1 },
  formulaGroup: { gap: spacing.sm, marginTop: spacing.sm },
  formula: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  exampleList: { gap: spacing.md },
  usageItem: { gap: spacing.sm, marginTop: spacing.md },
  mistake: { gap: spacing.xs, marginTop: spacing.md },
  mistakeRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  mistakeText: { flex: 1 },
  strike: { textDecorationLine: "line-through" },
  note: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  bullet: { flexDirection: "row", gap: spacing.sm },
});
