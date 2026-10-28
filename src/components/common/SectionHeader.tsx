import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme";
import { AppText } from "./AppText";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
});
