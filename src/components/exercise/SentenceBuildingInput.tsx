import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/common";
import type { SentenceBuildingQuestion } from "@/domain/models";
import { shuffleDifferent } from "@/domain/question-engine/shuffle";
import { colors, minTouchSize, radius, spacing } from "@/theme";

type Props = {
  question: SentenceBuildingQuestion;
  locked: boolean;
  /** Seçilen parçalar değiştikçe çağrılır; hiç parça yoksa boş dizi. */
  onChange: (tokens: string[]) => void;
};

export function SentenceBuildingInput({ question, locked, onChange }: Props) {
  // Parçalar sabit bir sırayla karıştırılır; aynı kelime birden fazla kez olabilir, bu yüzden indeksle izlenir.
  const pieces = useMemo(
    () => shuffleDifferent([...question.answer, ...(question.distractors ?? [])], question.id),
    [question],
  );
  const [selected, setSelected] = useState<number[]>([]);

  const update = (next: number[]) => {
    setSelected(next);
    onChange(next.map((i) => pieces[i]));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.answerArea} accessibilityLabel="Kurduğun cümle">
        {selected.length === 0 ? (
          <AppText color="textMuted">Aşağıdaki parçalara dokunarak cümleyi kur.</AppText>
        ) : (
          <View style={styles.chips}>
            {selected.map((pieceIndex, position) => (
              <Pressable
                key={`${pieceIndex}-${position}`}
                disabled={locked}
                onPress={() => update(selected.filter((_, p) => p !== position))}
                accessibilityRole="button"
                accessibilityLabel={`${pieces[pieceIndex]}. Kaldırmak için dokun`}
                style={[styles.chip, styles.chipSelected]}
              >
                <AppText variant="bodyStrong" color="onAccent">{pieces[pieceIndex]}</AppText>
              </Pressable>
            ))}
            <AppText variant="bodyStrong" style={styles.punctuation}>{question.endPunctuation}</AppText>
          </View>
        )}
      </View>

      <View style={styles.chips} accessibilityLabel="Kelime parçaları">
        {pieces.map((piece, i) => {
          const used = selected.includes(i);
          return (
            <Pressable
              key={i}
              disabled={locked || used}
              onPress={() => update([...selected, i])}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked || used }}
              accessibilityLabel={used ? `${piece}, kullanıldı` : `${piece}. Eklemek için dokun`}
              style={[styles.chip, used && styles.chipUsed]}
            >
              <AppText variant="bodyStrong" color={used ? "textMuted" : "text"}>{piece}</AppText>
            </Pressable>
          );
        })}
      </View>

      {!locked ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button title="Geri al" variant="secondary" disabled={selected.length === 0} onPress={() => update(selected.slice(0, -1))} />
          </View>
          <View style={styles.action}>
            <Button title="Temizle" variant="ghost" disabled={selected.length === 0} onPress={() => update([])} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  answerArea: {
    minHeight: 76,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  chip: {
    minHeight: minTouchSize - 4,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipUsed: { opacity: 0.35 },
  punctuation: { paddingHorizontal: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
