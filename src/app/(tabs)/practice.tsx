import { router } from "expo-router";

import { AppText, Card, Screen } from "@/components/common";
import { getQuestionById } from "@/data/contentRepository";
import { buildMistakeItems, unresolvedItems } from "@/features/mistakes/viewModel";
import { useUserState } from "@/services/progress/userStore";

export default function PracticeHubScreen() {
  const { mistakes, reviewList } = useUserState();
  const unresolved = unresolvedItems(buildMistakeItems(mistakes, getQuestionById)).length;

  return (
    <Screen>
      <AppText color="textSecondary">Öğrendiklerini pekiştirmek için istediğin zaman çalış. Her şey senin kontrolünde.</AppText>

      <Card onPress={() => router.push("/mistakes")} accessibilityLabel={`Yanlışlarım, ${unresolved} çözülmemiş soru`}>
        <AppText variant="subheading">Yanlışlarım</AppText>
        <AppText color="textSecondary">
          {unresolved > 0 ? `${unresolved} çözülmemiş soru seni bekliyor.` : "Çözülmemiş yanlışın yok."} Açıklamalarıyla gör, tekrar çöz.
        </AppText>
      </Card>

      <Card onPress={() => router.push("/review")} accessibilityLabel={`Tekrar listem, ${reviewList.length} konu`}>
        <AppText variant="subheading">Tekrar listem</AppText>
        <AppText color="textSecondary">
          {reviewList.length > 0 ? `${reviewList.length} konu listende.` : "Tekrar etmek istediğin konuları ekle."} Geçmiş sınavlarını da buradan yeniden çözebilirsin.
        </AppText>
      </Card>

      <Card onPress={() => router.push("/mixed")} accessibilityLabel="Karışık test">
        <AppText variant="subheading">Karışık test</AppText>
        <AppText color="textSecondary">Birden fazla konudan, seçtiğin soru türleriyle bir test oluştur.</AppText>
      </Card>
    </Screen>
  );
}
