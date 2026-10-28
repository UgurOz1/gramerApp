import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";

import { AppText } from "@/components/common";
import { isCatalogLoaded } from "@/features/curriculum/catalog";
import { userStore } from "@/services/progress/userStore";
import { colors, spacing } from "@/theme";

// Kullanıcı verisi yüklenene kadar (genelde birkaç ms) açılış ekranı kalır.
SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(userStore.isHydrated());

  useEffect(() => {
    if (ready) return;
    // hydrate hata fırlatmaz; okunamayan veri varsayılan duruma döner.
    userStore.hydrate().finally(() => setReady(true));
  }, [ready]);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") void userStore.flush();
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {isCatalogLoaded() ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: "minimal",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="level/[levelId]" options={{ title: "" }} />
          <Stack.Screen name="lesson/[lessonId]" options={{ title: "" }} />
          <Stack.Screen name="practice/[lessonId]" options={{ title: "Alıştırma" }} />
          <Stack.Screen name="exam/[lessonId]" options={{ title: "Sınav" }} />
          <Stack.Screen name="exam/result" options={{ title: "Sınav sonucu" }} />
          <Stack.Screen name="comparisons/index" options={{ title: "Karşılaştırmalı gramer" }} />
          <Stack.Screen name="comparisons/[comparisonId]" options={{ title: "" }} />
          <Stack.Screen name="mistakes/index" options={{ title: "Yanlışlarım" }} />
          <Stack.Screen name="mistakes/practice" options={{ title: "Yanlışları tekrar çöz" }} />
          <Stack.Screen name="review/index" options={{ title: "Tekrar listem" }} />
          <Stack.Screen name="mixed/index" options={{ title: "Karışık test" }} />
          <Stack.Screen name="mixed/run" options={{ title: "Karışık test" }} />
        </Stack>
      ) : (
        <View style={styles.error}>
          <AppText variant="heading">İçerik yüklenemedi</AppText>
          <AppText color="textSecondary">
            Ders kataloğu okunamadı. Uygulamayı güncellemeyi veya yeniden yüklemeyi dene. İlerleme verilerin silinmedi.
          </AppText>
        </View>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
});
