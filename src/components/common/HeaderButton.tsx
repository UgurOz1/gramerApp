import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme";
import { Icon, icons } from "./Icon";

type Props = {
  /** "back": önceki ekran; "close": çalışan bir oturumdan çıkış. */
  kind?: "back" | "close";
};

/** Başlık çubuğunun solundaki yuvarlak, dokunması kolay geri / kapat düğmesi. */
export function HeaderButton({ kind = "back" }: Props) {
  const onPress = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={kind === "close" ? "Kapat" : "Geri"}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name={kind === "close" ? icons.close : icons.chevronLeft} size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});
