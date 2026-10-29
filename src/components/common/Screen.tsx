import { useRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

type Props = {
  children: ReactNode;
  /** Ekranın altında sabit duran alan (ör. "Sonraki adım" butonu). Klavye açılınca yukarı çıkar. */
  footer?: ReactNode;
  /** İçeriğin sonuna gelindiğinde bir kez çağrılır (ör. dersin okundu sayılması). */
  onReachEnd?: () => void;
  /** Başlık çubuğu olmayan ekranlarda üst güvenli alan boşluğunu ekler. */
  safeTop?: boolean;
};

/** Kaydırılabilir standart ekran kabı. */
export function Screen({ children, footer, onReachEnd, safeTop }: Props) {
  const reached = useRef(false);
  const insets = useSafeAreaInsets();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onReachEnd || reached.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 80) {
      reached.current = true;
      onReachEnd();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, safeTop && { paddingTop: insets.top + spacing.lg }]}
        contentInsetAdjustmentBehavior={safeTop ? "never" : "automatic"}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={onReachEnd ? handleScroll : undefined}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: "0px -8px 24px rgba(0, 0, 0, 0.35)",
  },
});
