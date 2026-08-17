import { Tabs } from "expo-router";
import { Compass, ListChecks, UserRound } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomBar, type TabMeta } from "@/components/nav/bottom-bar";
import { Swipeable } from "@/components/nav/swipeable";
import { ModeBar } from "@/components/nav/mode-bar";
import { OfflineBanner } from "@/components/teregna/offline-banner";

const TABS: TabMeta[] = [
  { name: "browse", labelKey: "nav.browse", icon: Compass },
  { name: "requests", labelKey: "nav.myRequests", icon: ListChecks },
  { name: "account", labelKey: "nav.account", icon: UserRound },
];

const ROUTES = ["/browse", "/requests", "/account"];

/** The customer surface: find, queue, account. Nothing about running a shop. */
export default function CustomerLayout() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <OfflineBanner />
      <ModeBar mode="customer" />
      <Swipeable routes={ROUTES}>
        <Tabs
          screenOptions={{ headerShown: false, animation: "fade" }}
          tabBar={(props) => <BottomBar {...props} tabs={TABS} />}
        >
          <Tabs.Screen name="browse" />
          <Tabs.Screen name="requests" />
          <Tabs.Screen name="account" />
        </Tabs>
      </Swipeable>
    </SafeAreaView>
  );
}
