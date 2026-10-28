import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme";

type Props = {
  children: ReactNode;
  /** Ekranın altında sabit duran alan (ör. "Sonraki adım" butonu). */
  footer?: ReactNode;
};

/** Kaydırılabilir standart ekran kabı. */
export function Screen({ children, footer }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
