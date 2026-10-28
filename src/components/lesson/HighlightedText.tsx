import type { TextStyle } from "react-native";

import { AppText } from "@/components/common";
import type { TypographyVariant } from "@/theme";

type Props = {
  text: string;
  highlight?: string;
  variant?: TypographyVariant;
  style?: TextStyle;
};

/** Cümlede bir kısmı (ör. "is") vurgulu gösterir. */
export function HighlightedText({ text, highlight, variant = "bodyStrong", style }: Props) {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || at < 0) {
    return <AppText variant={variant} style={style}>{text}</AppText>;
  }
  return (
    <AppText variant={variant} style={style}>
      {text.slice(0, at)}
      <AppText variant={variant} color="accent" style={styles.highlight}>{highlight}</AppText>
      {text.slice(at + highlight.length)}
    </AppText>
  );
}

const styles = { highlight: { textDecorationLine: "underline" } } as const;
