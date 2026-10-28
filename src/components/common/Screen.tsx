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

import { colors, spacing } from "@/theme";

type Props = {
  children: ReactNode;
  /** Ekranın altında sabit duran alan (ör. "Sonraki adım" butonu). Klavye açılınca yukarı çıkar. */
  footer?: ReactNode;
  /** İçeriğin sonuna gelindiğinde bir kez çağrılır (ör. dersin okundu sayılması). */
  onReachEnd?: () => void;
};

/** Kaydırılabilir standart ekran kabı. */
export function Screen({ children, footer, onReachEnd }: Props) {
  const reached = useRef(false);

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
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={onReachEnd ? handleScroll : undefined}
        scrollEventThrottle={100}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
