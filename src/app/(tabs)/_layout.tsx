import { Tabs } from "expo-router";

import { Icon } from "@/components/common";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          headerTitle: "GrammarPath",
          tabBarIcon: ({ color, size }) => (
            <Icon name={{ ios: "house.fill", android: "home", web: "home" }} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          title: "Müfredat",
          tabBarIcon: ({ color, size }) => (
            <Icon name={{ ios: "books.vertical.fill", android: "menu_book", web: "menu_book" }} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
