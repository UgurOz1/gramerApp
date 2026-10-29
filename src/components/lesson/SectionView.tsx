import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Icon, IconBubble, icons, type IconName } from "@/components/common";
import { getLessonSummary, isLessonAvailable } from "@/features/curriculum/catalog";
import { lessonHref } from "@/features/curriculum/routes";
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

/** Bölüm başlığı: renkli simge + küçük etiket + başlık. */
function SectionTitle({ icon, label, title, color, bg }: { icon: IconName; label: string; title: string; color: string; bg: string }) {
  return (
    <View style={styles.titleRow}>
      <IconBubble icon={icon} color={color} background={bg} size={40} />
      <View style={styles.flex}>
        <AppText variant="label" style={{ color }}>{label}</AppText>
        <AppText variant="heading" accessibilityRole="header">{title}</AppText>
      </View>
    </View>
  );
}

function Formula({ text, label }: { text: string; label?: string }) {
  return (
    <View style={styles.formula}>
      {label ? <AppText variant="label" color="textSecondary">{label.toUpperCase()}</AppText> : null}
      <AppText variant="subheading" style={styles.formulaText}>{text}</AppText>
    </View>
  );
}

export function SectionView({ section, lesson, sessionId, showHint }: Props) {
  const examples = (ids: string[] = []) =>
    ids.map((id) => lesson.examples.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e);

  const renderExamples = (ids?: string[]) => {
    const list = examples(ids);
    if (list.length === 0) return null;
    return <View style={styles.exampleList}>{list.map((e) => <ExampleItem key={e.id} example={e} />)}</View>;
  };

  switch (section.type) {
    case "intro":
      return (
        <Card>
          <SectionTitle icon={icons.book} label="GİRİŞ" title={section.title} color={colors.info} bg={colors.infoMuted} />
          {section.paragraphs.map((p, i) => <AppText key={i} style={styles.paragraph}>{p}</AppText>)}
        </Card>
      );

    case "rule":
      return (
        <Card accentColor={colors.accent}>
          <SectionTitle icon={icons.bolt} label="KURAL" title={section.title} color={colors.accent} bg={colors.accentMuted} />
          {section.paragraphs.map((p, i) => <AppText key={i} style={styles.paragraph}>{p}</AppText>)}
          {section.formulas?.map((f) => (
            <View key={f.label} style={styles.formulaGroup}>
              <Formula label={f.label} text={f.pattern} />
              {renderExamples(f.exampleIds)}
            </View>
          ))}
        </Card>
      );

    case "forms":
      return (
        <View style={styles.stack}>
          <Card>
            <SectionTitle icon={icons.school} label="YAPILAR" title={section.title} color={colors.accent} bg={colors.accentMuted} />
            {section.paragraphs?.map((p, i) => <AppText key={i} style={styles.paragraph}>{p}</AppText>)}
          </Card>
          {section.forms.map((f) => (
            <Card key={f.label}>
              <Formula label={f.label} text={f.formula} />
              {renderExamples(f.exampleIds)}
              {f.note ? <AppText variant="caption" color="textSecondary">ℹ️ {f.note}</AppText> : null}
            </Card>
          ))}
        </View>
      );

    case "examples":
      return (
        <Card>
          <SectionTitle icon={icons.quiz} label="ÖRNEKLER" title={section.title} color={colors.success} bg={colors.successMuted} />
          {section.paragraphs?.map((p, i) => <AppText key={i} color="textSecondary">{p}</AppText>)}
          {renderExamples(section.exampleIds)}
        </Card>
      );

    case "usage":
      return (
        <Card>
          <SectionTitle icon={icons.bulb} label="KULLANIM" title={section.title} color={colors.warning} bg={colors.warningMuted} />
          {section.paragraphs?.map((p, i) => <AppText key={i} style={styles.paragraph}>{p}</AppText>)}
          {section.items.map((item) => (
            <View key={item.heading} style={styles.usageItem}>
              <AppText variant="subheading">{item.heading}</AppText>
              <AppText style={styles.paragraph}>{item.body}</AppText>
              {renderExamples(item.exampleIds)}
            </View>
          ))}
        </Card>
      );

    case "mistakes":
      return (
        <Card>
          <SectionTitle icon={icons.warning} label="DİKKAT" title={section.title} color={colors.danger} bg={colors.dangerMuted} />
          {section.items.map((item) => (
            <View key={item.wrong} style={styles.mistake}>
              <View style={[styles.pair, styles.pairWrong]}>
                <Icon name={icons.xCircle} color={colors.danger} size={20} />
                <AppText color="danger" style={[styles.flex, styles.strike]}>{item.wrong}</AppText>
              </View>
              <View style={[styles.pair, styles.pairRight]}>
                <Icon name={icons.checkCircle} color={colors.success} size={20} />
                <AppText variant="bodyStrong" color="success" style={styles.flex}>{item.right}</AppText>
              </View>
              <AppText variant="caption" color="textSecondary" style={styles.mistakeNote}>{item.explanation}</AppText>
            </View>
          ))}
        </Card>
      );

    case "confusions":
      return (
        <Card>
          <SectionTitle icon={icons.compare} label="KARIŞTIRMA" title={section.title} color={colors.info} bg={colors.infoMuted} />
          {section.items.map((item) => {
            const related = item.lessonId ? getLessonSummary(item.lessonId) : undefined;
            return (
              <View key={item.topic} style={styles.confusion}>
                <AppText variant="subheading">{item.topic}</AppText>
                <AppText color="textSecondary">{item.body}</AppText>
                {related && item.lessonId && isLessonAvailable(item.lessonId) ? (
                  <Button
                    title={`Dersi aç: ${related.title}`}
                    variant="secondary"
                    icon={icons.arrowRight}
                    onPress={() => router.push(lessonHref(item.lessonId!))}
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
      const color = warn ? colors.warning : colors.accent;
      return (
        <View style={[styles.note, { borderColor: `${color}66`, backgroundImage: `linear-gradient(150deg, ${warn ? colors.warningMuted : colors.accentMuted} 0%, ${colors.surface} 100%)` }]}>
          <View style={styles.titleRow}>
            <AppText style={styles.noteEmoji}>{warn ? "⚠️" : "📌"}</AppText>
            <AppText variant="heading" accessibilityRole="header" style={styles.flex}>{section.title}</AppText>
          </View>
          {section.items.map((item, i) => (
            <View key={i} style={styles.bullet}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <AppText style={styles.flex}>{item}</AppText>
            </View>
          ))}
        </View>
      );
    }

    case "check":
      return (
        <View style={styles.stack}>
          <View style={styles.checkHead}>
            <AppText style={styles.checkEmoji}>🧠</AppText>
            <View style={styles.flex}>
              <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
              <AppText variant="caption" color="textSecondary">Öğrendiklerini hemen dene. Cevabın kaydedilir ama sınav sonucunu etkilemez.</AppText>
            </View>
          </View>
          {section.questionIds.map((id) => {
            const q = lesson.exercises.find((x) => x.id === id);
            return q ? <InlineCheck key={id} question={q} sessionId={sessionId} showHint={showHint} /> : null;
          })}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  paragraph: { lineHeight: 25 },
  formulaGroup: { gap: spacing.sm, marginTop: spacing.sm },
  formula: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: "#3E3A8A",
  },
  formulaText: { color: "#D9D4FF" },
  exampleList: { gap: spacing.sm },
  usageItem: { gap: spacing.sm, marginTop: spacing.md },
  mistake: { gap: 6, marginTop: spacing.sm },
  pair: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, borderRadius: radius.md },
  pairWrong: { backgroundColor: colors.dangerMuted },
  pairRight: { backgroundColor: colors.successMuted },
  strike: { textDecorationLine: "line-through" },
  mistakeNote: { paddingHorizontal: spacing.xs },
  confusion: { gap: spacing.xs, marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  note: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surface },
  noteEmoji: { fontSize: 26, lineHeight: 32 },
  bullet: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 9 },
  checkHead: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  checkEmoji: { fontSize: 34, lineHeight: 40 },
});
