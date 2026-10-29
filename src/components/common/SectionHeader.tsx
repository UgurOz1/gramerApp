import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  /** Sağdaki küçük bağlantı (ör. "Tümü"). */
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.text}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? <AppText variant="caption" color="textSecondary">{subtitle}</AppText> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={12}>
          <AppText variant="bodyStrong" color="accent">{action.label}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md, marginTop: spacing.sm },
  text: { flex: 1, gap: 2 },
});
