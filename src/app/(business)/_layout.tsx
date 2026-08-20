import { Tabs } from "expo-router";
import { Archive, ChartColumn, ListOrdered, Package } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomBar, type TabMeta } from "@/components/nav/bottom-bar";
import { Swipeable } from "@/components/nav/swipeable";
import { ModeBar } from "@/components/nav/mode-bar";
import { OfflineBanner } from "@/components/teregna/offline-banner";
import { useMyProvider } from "@/lib/queries";

const TABS: TabMeta[] = [
  { name: "index", labelKey: "pq.title", icon: ListOrdered },
  { name: "archive", labelKey: "arc.title", icon: Archive },
  { name: "items", labelKey: "it.title", icon: Package },
  { name: "analytics", labelKey: "an.title", icon: ChartColumn },
];

const ROUTES = ["/", "/archive", "/items", "/analytics"];

/**
 * The provider surface.
 *
 * Its own tab bar, its own chrome, and none of the customer routes - a provider
 * working a shift has no use for Browse. The way back is in the top bar.
 *
 * Onboarding is hidden from the bar: it is a one-time flow reached from the
 * empty state, not a destination.
 */
export default function BusinessLayout() {
  const { data: provider } = useMyProvider();

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <OfflineBanner />
      <ModeBar mode="business" provider={provider} />
      <Swipeable routes={ROUTES}>
        <Tabs
          screenOptions={{ headerShown: false, animation: "fade" }}
          tabBar={(props) => <BottomBar {...props} tabs={TABS} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="archive" />
          <Tabs.Screen name="items" />
          <Tabs.Screen name="analytics" />
          <Tabs.Screen name="onboarding" options={{ href: null }} />
        </Tabs>
      </Swipeable>
    </SafeAreaView>
  );
}
