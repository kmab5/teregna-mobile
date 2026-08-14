import { Tabs } from "expo-router";
import { Compass, ListChecks, Store, UserRound } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/i18n/provider";
import { useAuth } from "@/lib/auth";

/**
 * Bottom tabs.
 *
 * The same reasoning as the web app's mobile bar, only here it is the native
 * default: a receiver checking their position and a provider finishing the next
 * request are both one-handed, standing up, thumb near the bottom of the screen.
 *
 * Signed-out users see only Browse and Account - the other two would lead
 * straight to a login wall, and a tab that always bounces you is worse than an
 * absent one.
 */
export default function TabsLayout() {
  const t = useT();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const dark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? "#A78BFA" : "#6D28D9",
        tabBarInactiveTintColor: dark ? "#B7ACD6" : "#5B517A",
        tabBarStyle: {
          backgroundColor: dark ? "#1E1836" : "#FFFFFF",
          borderTopColor: dark ? "#2E2650" : "#E6DEF7",
          // Grow by the system inset rather than a fixed height. Without this
          // the last row of labels sits inside Android's gesture strip and iOS's
          // home-indicator area - readable, but the bottom few pixels of each
          // target are swallowed by the OS.
          height: 58 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          // Keeps the outer icons off the screen edge on wide phones.
          paddingHorizontal: 8,
        },
        tabBarItemStyle: { paddingHorizontal: 4 },
        tabBarLabelStyle: {
          fontFamily: "WorkSans_500Medium",
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: t("nav.browse"),
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t("nav.myRequests"),
          href: user ? undefined : null,
          tabBarIcon: ({ color, size }) => <ListChecks size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: t("nav.myBusiness"),
          href: user ? undefined : null,
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("nav.account"),
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
