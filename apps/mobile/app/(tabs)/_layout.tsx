import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { AuthGate } from "@/components/AuthGate";
import { RecordFab } from "@/components/RecordFab";
import { theme } from "@/lib/theme";

/**
 * Three tabs (Decision 13.2): Feed, Inbox, Profile — plus the always-visible
 * camera FAB overlaid bottom-right on every tab.
 */
export default function TabLayout() {
  return (
    <AuthGate>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border },
            tabBarActiveTintColor: theme.colors.text,
            tabBarInactiveTintColor: theme.colors.textMuted,
          }}
        >
          <Tabs.Screen
            name="feed"
            options={{
              title: "Feed",
              tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: "Inbox",
              tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "You",
              tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
            }}
          />
        </Tabs>
        <RecordFab />
      </View>
    </AuthGate>
  );
}
