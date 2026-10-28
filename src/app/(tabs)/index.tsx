import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen, SectionHeader } from "@/components/common";
import { LevelCard } from "@/components/progress/LevelCard";
import { getCatalogStats, getLessonsForLevel, getLevels } from "@/features/curriculum/catalog";
import { spacing } from "@/theme";

const STUDY_FLOW = [
  "Konuyu Türkçe anlatımla öğren",
  "Örnek cümleleri incele",
  "Kısa alıştırmalarla uygula",
  "Konu sonu sınavını çöz",
  "Hatalarını incele ve tekrar et",
];

export default function HomeScreen() {
  const levels = getLevels();
  const stats = getCatalogStats();

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title">Merhaba!</AppText>
        <AppText color="textSecondary">
          {"A1'den B2'ye İngilizce grameri adım adım öğren. Her şey cihazında, internet gerekmez."}
        </AppText>
      </View>

      <Card>
        <AppText variant="subheading">Nasıl çalışırsın?</AppText>
        {STUDY_FLOW.map((step, i) => (
          <View key={step} style={styles.step}>
            <AppText variant="bodyStrong" color="accent" style={styles.stepNo}>
              {i + 1}
            </AppText>
            <AppText style={styles.stepText}>{step}</AppText>
          </View>
        ))}
      </Card>

      <SectionHeader
        title="Seviyeler"
        subtitle={`${stats.lessonCount} konu, ${stats.unitCount} ünite`}
      />
      {levels.map((level) => (
        <LevelCard
          key={level.id}
          level={level}
          lessonCount={getLessonsForLevel(level.id).length}
          onPress={() => router.push({ pathname: "/level/[levelId]", params: { levelId: level.id } })}
        />
      ))}

      <Button title="Tüm müfredatı gör" variant="secondary" onPress={() => router.navigate("/levels")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNo: { width: 20 },
  stepText: { flex: 1 },
});
