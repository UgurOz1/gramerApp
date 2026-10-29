import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Button, icons } from "@/components/common";
import type { SentenceBuildingQuestion } from "@/domain/models";
import { shuffleDifferent } from "@/domain/question-engine/shuffle";
import { colors, gradients, minTouchSize, radius, spacing } from "@/theme";

type Props = {
  question: SentenceBuildingQuestion;
  locked: boolean;
  status?: "correct" | "wrong";
  /** Seçilen parçalar değiştikçe çağrılır; hiç parça yoksa boş dizi. */
  onChange: (tokens: string[]) => void;
};

export function SentenceBuildingInput({ question, locked, status, onChange }: Props) {
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
      <View
        style={[styles.answerArea, status === "correct" && styles.areaCorrect, status === "wrong" && styles.areaWrong]}
        accessibilityLabel="Kurduğun cümle"
      >
        {selected.length === 0 ? (
          <AppText color="textMuted" style={styles.placeholder}>👇 Aşağıdaki parçalara dokunarak cümleyi kur.</AppText>
        ) : (
          <View style={styles.chips}>
            {selected.map((pieceIndex, position) => (
              <Pressable
                key={`${pieceIndex}-${position}`}
                disabled={locked}
                onPress={() => update(selected.filter((_, p) => p !== position))}
                accessibilityRole="button"
                accessibilityLabel={`${pieces[pieceIndex]}. Kaldırmak için dokun`}
                style={({ pressed }) => [styles.chip, styles.chipSelected, pressed && styles.chipPressed]}
              >
                <AppText variant="bodyStrong" style={styles.chipSelectedText}>{pieces[pieceIndex]}</AppText>
              </Pressable>
            ))}
            <AppText variant="heading" style={styles.punctuation}>{question.endPunctuation}</AppText>
          </View>
        )}
      </View>

      <View style={[styles.chips, styles.bank]} accessibilityLabel="Kelime parçaları">
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
              style={({ pressed }) => [styles.chip, used && styles.chipUsed, pressed && !used && styles.chipPressed]}
            >
              <AppText variant="bodyStrong" color={used ? "textMuted" : "text"} style={used && styles.usedText}>{piece}</AppText>
            </Pressable>
          );
        })}
      </View>

      {!locked ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button title="Geri al" icon={icons.undo} variant="secondary" disabled={selected.length === 0} onPress={() => update(selected.slice(0, -1))} />
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
    minHeight: 92,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  areaCorrect: { borderColor: colors.success, borderStyle: "solid", backgroundColor: colors.successMuted },
  areaWrong: { borderColor: colors.danger, borderStyle: "solid", backgroundColor: colors.dangerMuted },
  placeholder: { textAlign: "center" },
  bank: { justifyContent: "center", paddingVertical: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  chip: {
    minHeight: minTouchSize - 2,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    boxShadow: "0px 3px 0px rgba(0,0,0,0.4)",
  },
  chipSelected: { backgroundColor: colors.accentStrong, backgroundImage: gradients.primary, borderColor: "#8E83FF", boxShadow: "0px 3px 0px #3F35A8" },
  chipSelectedText: { color: "#FFFFFF" },
  chipPressed: { transform: [{ translateY: 2 }], boxShadow: "0px 1px 0px rgba(0,0,0,0.4)" },
  chipUsed: { backgroundColor: colors.background, borderColor: colors.border, boxShadow: "none", borderStyle: "dashed" },
  usedText: { opacity: 0.25 },
  punctuation: { paddingHorizontal: 2 },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
