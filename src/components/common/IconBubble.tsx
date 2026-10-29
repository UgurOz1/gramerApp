import { StyleSheet, View } from "react-native";

import { radius } from "@/theme";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

type Props = {
  /** Simge ya da emoji'den biri verilir. */
  icon?: IconName;
  emoji?: string;
  color: string;
  background: string;
  size?: number;
  /** Degrade zemin (verilirse background'ın üstüne çizilir). */
  gradient?: string;
};

/** Yuvarlatılmış, renkli zemin üzerinde simge. */
export function IconBubble({ icon, emoji, color, background, size = 44, gradient }: Props) {
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: background },
        gradient ? { backgroundImage: gradient } : null,
      ]}
    >
      {emoji ? (
        <AppText style={{ fontSize: size * 0.48, lineHeight: size * 0.6 }}>{emoji}</AppText>
      ) : icon ? (
        <Icon name={icon} size={size * 0.5} color={color} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { alignItems: "center", justifyContent: "center", borderRadius: radius.md },
});
