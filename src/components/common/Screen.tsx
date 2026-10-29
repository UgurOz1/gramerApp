import { useEffect, useRef, type ComponentRef, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";
import { useKeyboardHeight } from "./useKeyboardHeight";

type Props = {
  children: ReactNode;
  /** Ekranın altında sabit duran alan (ör. "Sonraki adım" butonu). Klavye açılınca klavyenin üstüne çıkar. */
  footer?: ReactNode;
  /** İçeriğin sonuna gelindiğinde bir kez çağrılır (ör. dersin okundu sayılması). */
  onReachEnd?: () => void;
  /** Kaydırma alanının üstünde sabit duran alan (ör. adım göstergesi). */
  header?: ReactNode;
  /** Değiştiğinde kaydırma en üste döner (ör. adım değişince). */
  resetKey?: unknown;
  /** Başlık çubuğu olmayan ekranlarda üst güvenli alan boşluğunu ekler. */
  safeTop?: boolean;
};

/** Kaydırılabilir standart ekran kabı. */
export function Screen({ children, footer, header, resetKey, onReachEnd, safeTop }: Props) {
  const reached = useRef(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [resetKey]);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onReachEnd || reached.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 80) {
      reached.current = true;
      onReachEnd();
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: keyboardHeight }]}>
      {header}
      <ScrollView
        ref={scrollRef}
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
      {footer ? <View style={[styles.footer, { paddingBottom: keyboardHeight > 0 ? spacing.md : Math.max(insets.bottom, spacing.lg) }]}>{footer}</View> : null}
    </View>
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
