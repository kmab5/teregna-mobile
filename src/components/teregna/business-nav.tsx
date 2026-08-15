import { Pressable, ScrollView, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import {
  Archive,
  ChartColumn,
  ListOrdered,
  Package,
  Settings,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import type { Provider } from "@/lib/database.types";

const SECTIONS = [
  { path: "/business", labelKey: "pq.title", icon: ListOrdered },
  { path: "/business/archive", labelKey: "arc.title", icon: Archive },
  { path: "/business/items", labelKey: "it.title", icon: Package },
  { path: "/business/analytics", labelKey: "an.title", icon: ChartColumn },
  { path: "/business/settings", labelKey: "set.title", icon: Settings },
] as const;

/**
 * Provider chrome: business name, live open/closed state, and section nav.
 *
 * Dark, unlike the rest of the app, so the two surfaces never feel like the
 * same screen with different content.
 */
export function BusinessNav({ provider }: { provider: Provider | null }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="bg-chrome dark:bg-d-chrome">
      <View className="flex-row items-center gap-2.5 px-5 pb-2 pt-4">
        <Text
          numberOfLines={1}
          className="flex-1 font-medium text-[15px] text-on-chrome dark:text-d-on-chrome"
        >
          {provider?.name ?? t("nav.myBusiness")}
        </Text>

        {provider ? (
          <View
            className={cn(
              "flex-row items-center gap-1.5 rounded-full px-2.5 py-1",
              provider.is_active
                ? "bg-accent/30"
                : "bg-chrome-border dark:bg-d-chrome-border",
            )}
          >
            <View
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                provider.is_active ? "bg-accent" : "bg-on-chrome-muted",
              )}
            />
            <Text className="text-[11px] font-medium text-on-chrome dark:text-d-on-chrome">
              {provider.is_active ? t("chk.open") : t("pq.closed")}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 gap-1 pb-1 pr-8"
      >
        {SECTIONS.map(({ path, labelKey, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Pressable
              key={path}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(path as never)}
              className={cn(
                "flex-row items-center gap-1.5 border-b-2 px-2.5 py-2.5",
                active ? "border-white" : "border-transparent",
              )}
            >
              <Icon size={15} color={active ? "#FFFFFF" : "#BDB4D4"} />
              <Text
                className={cn(
                  "text-[13px] font-medium",
                  active
                    ? "text-on-chrome dark:text-d-on-chrome"
                    : "text-on-chrome-muted dark:text-d-on-chrome-muted",
                )}
              >
                {t(labelKey as never)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
