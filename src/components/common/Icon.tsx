import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

export type IconName = ComponentProps<typeof SymbolView>["name"];

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
};

/** iOS'ta SF Symbols, Android/web'de Material Symbols kullanır. */
export function Icon({ name, size = 24, color }: Props) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}

/** Sık kullanılan simgeler (iOS / Android / web adları). */
export const icons = {
  chevronLeft: { ios: "chevron.left", android: "chevron_left", web: "chevron_left" },
  close: { ios: "xmark", android: "close", web: "close" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  check: { ios: "checkmark", android: "check", web: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  xCircle: { ios: "xmark.circle.fill", android: "cancel", web: "cancel" },
  play: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
  flame: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
  target: { ios: "target", android: "track_changes", web: "track_changes" },
  bolt: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  trophy: { ios: "trophy.fill", android: "emoji_events", web: "emoji_events" },
  book: { ios: "book.fill", android: "menu_book", web: "menu_book" },
  shuffle: { ios: "shuffle", android: "shuffle", web: "shuffle" },
  compare: { ios: "arrow.left.arrow.right", android: "compare_arrows", web: "compare_arrows" },
  replay: { ios: "arrow.counterclockwise", android: "replay", web: "replay" },
  bookmark: { ios: "bookmark.fill", android: "bookmark", web: "bookmark" },
  bookmarkAdd: { ios: "bookmark", android: "bookmark_add", web: "bookmark_add" },
  error: { ios: "exclamationmark.circle.fill", android: "error", web: "error" },
  warning: { ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" },
  info: { ios: "info.circle.fill", android: "info", web: "info" },
  bulb: { ios: "lightbulb.fill", android: "lightbulb", web: "lightbulb" },
  clock: { ios: "clock.fill", android: "schedule", web: "schedule" },
  star: { ios: "star.fill", android: "star", web: "star" },
  school: { ios: "graduationcap.fill", android: "school", web: "school" },
  edit: { ios: "pencil", android: "edit", web: "edit" },
  undo: { ios: "arrow.uturn.backward", android: "undo", web: "undo" },
  skip: { ios: "forward.fill", android: "skip_next", web: "skip_next" },
  arrowRight: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  quiz: { ios: "questionmark.circle.fill", android: "quiz", web: "quiz" },
} satisfies Record<string, IconName>;
