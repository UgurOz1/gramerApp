import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, IconBubble, PageHero, Screen, icons, type IconName } from "@/components/common";
import { getQuestionById } from "@/data/contentRepository";
import { buildMistakeItems, unresolvedItems } from "@/features/mistakes/viewModel";
import { useUserState } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";

export default function PracticeHubScreen() {
  const { mistakes, reviewList } = useUserState();
  const unresolved = unresolvedItems(buildMistakeItems(mistakes, getQuestionById)).length;

  return (
    <Screen>
      <PageHero
        emoji="💪"
        title="Pratik alanı"
        subtitle="Öğrendiklerini pekiştir. Ne zaman, ne kadar çalışacağın senin elinde."
        gradient="linear-gradient(150deg, #3B2F9E66 0%, #141829 70%)"
      />

      <HubCard
        icon={icons.error}
        color={colors.danger}
        bg={colors.dangerMuted}
        title="Yanlışlarım"
        count={unresolved}
        text={unresolved > 0 ? `${unresolved} çözülmemiş soru seni bekliyor. Açıklamalarıyla gör, tekrar çöz.` : "Çözülmemiş yanlışın yok. Harika! 🎉"}
        onPress={() => router.push("/mistakes")}
      />
      <HubCard
        icon={icons.bookmark}
        color={colors.warning}
        bg={colors.warningMuted}
        title="Tekrar listem"
        count={reviewList.length}
        text={reviewList.length > 0 ? `${reviewList.length} konu listende. Geçmiş sınavlarını da buradan yeniden çöz.` : "Tekrar etmek istediğin konuları ekle, sınav geçmişini gör."}
        onPress={() => router.push("/review")}
      />
      <HubCard
        icon={icons.shuffle}
        color={colors.info}
        bg={colors.infoMuted}
        title="Karışık test"
        text="Birden fazla konudan, seçtiğin soru türleriyle kendine özel bir test oluştur."
        onPress={() => router.push("/mixed")}
      />
      <HubCard
        icon={icons.compare}
        color={colors.accent}
        bg={colors.accentMuted}
        title="Karşılaştırmalı gramer"
        text="Benzer yapıları yan yana öğren: Present Simple mi, Present Continuous mu?"
        onPress={() => router.push("/comparisons")}
      />

      <View style={styles.tip}>
        <AppText style={styles.tipEmoji}>💡</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.flex}>
          İpucu: Her gün kısa süre çalışmak, haftada bir uzun çalışmaktan daha kalıcıdır. Günlük hedefin 20 soru.
        </AppText>
      </View>
    </Screen>
  );
}

function HubCard(props: { icon: IconName; color: string; bg: string; title: string; text: string; count?: number; onPress: () => void }) {
  return (
    <Card onPress={props.onPress} accessibilityLabel={props.count !== undefined ? `${props.title}, ${props.count}` : props.title}>
      <View style={styles.head}>
        <IconBubble icon={props.icon} color={props.color} background={props.bg} size={48} />
        <View style={styles.flex}>
          <AppText variant="subheading">{props.title}</AppText>
          <AppText variant="caption" color="textSecondary">{props.text}</AppText>
        </View>
        {props.count !== undefined && props.count > 0 ? (
          <View style={[styles.count, { backgroundColor: props.color }]}>
            <AppText variant="caption" style={styles.countText}>{props.count}</AppText>
          </View>
        ) : (
          <Icon name={icons.chevronRight} color={colors.textMuted} size={20} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  count: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  countText: { color: "#0A0C16", fontWeight: "800" },
  tip: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  tipEmoji: { fontSize: 22, lineHeight: 28 },
});
