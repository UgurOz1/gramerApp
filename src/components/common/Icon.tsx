import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

type Props = {
  name: SymbolName;
  size?: number;
  color?: ColorValue;
};

/** iOS'ta SF Symbols, Android/web'de Material Symbols kullanır. */
export function Icon({ name, size = 24, color }: Props) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}
