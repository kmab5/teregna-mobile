import { useState } from "react";
import { FlatList, Pressable, RefreshControl, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Search } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { QueuePill } from "@/components/teregna/queue-pill";
import { useCategories, useDiscovery } from "@/lib/queries";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import type { ProviderPublic } from "@/lib/database.types";
import { useThemeColors } from "@/theme/colors";

export default function BrowseScreen() {
  const c = useThemeColors();
  const t = useT();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { data: categories } = useCategories();

  /**
   * Derived, not stored: a selection is only valid relative to the current
   * category list, so a provider renaming their category cannot strand you on
   * an empty result with no way to tell why.
   */
  const activeCategory =
    category && categories?.includes(category) ? category : null;

  const { data, isPending, isRefetching, refetch } = useDiscovery(
    search,
    activeCategory,
  );

  return (
    <Screen title={t("browse.title")} subtitle={t("browse.subtitle")}>
      <View
        className="flex-row items-center gap-2 rounded-sm border px-3"
        style={{ backgroundColor: c.surface, borderColor: c.border }}
      >
        <Search size={16} color={c.inkMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("browse.searchPlaceholder")}
          accessibilityLabel={t("browse.searchLabel")}
          placeholderTextColor={c.inkMuted}
          className="h-12 flex-1 font-sans text-[16px]"
        />
      </View>

      {/* One category is the whole list, not a filter, so the row hides itself. */}
      {categories && categories.length > 1 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categories]}
          keyExtractor={(c) => c ?? "__all"}
          className="mt-3 max-h-11 grow-0"
          contentContainerClassName="gap-2 pr-4"
          renderItem={({ item }) => {
            const selected = activeCategory === item;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(selected ? null : item)}
                className={cn(
                  "h-9 justify-center rounded-full px-3.5",
                  selected
                    ? ""
                    : "",
                )}
              >
                <Text
                  className={cn(
                    "text-[13px] font-medium capitalize",
                    selected
                      ? ""
                      : "",
                  )}
                >
                  {item ?? t("common.all")}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        className="mt-4"
        contentContainerClassName="gap-3 pb-6"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
        }
        renderItem={({ item }) => <ProviderCard provider={item} />}
        ListEmptyComponent={
          isPending ? null : (
            <Card className="items-center py-10">
              <Text variant="title">{t("browse.emptyTitle")}</Text>
              <Text variant="small" className="mt-1 text-center">
                {search || activeCategory
                  ? t("browse.emptyFiltered")
                  : t("browse.emptyNone")}
              </Text>
            </Card>
          )
        }
      />
    </Screen>
  );
}

function ProviderCard({ provider }: { provider: ProviderPublic }) {
  const router = useRouter();
  const c = useThemeColors();

  /*
   * The touch target is a plain Pressable with a `style` prop and no className.
   *
   * NativeWind rewrites every element carrying a className through its JSX
   * interop, so keeping the interop off the element that owns `onPress` takes
   * one whole layer out of the touch path. The Card inside still uses classes -
   * it has no handler to lose.
   *
   * Navigation is an explicit router.push rather than <Link asChild>, which
   * injects onPress by cloning and can lose it entirely.
   */
  function open() {
    if (__DEV__) console.log("[nav] opening provider", provider.id);
    router.push({ pathname: "/p/[id]", params: { id: provider.id } });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={provider.name}
      onPress={open}
      android_ripple={{ color: "#6D28D922" }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <Text variant="title" className="flex-1">
            {provider.name}
          </Text>
          <QueuePill count={provider.queue_length} />
        </View>

        {provider.description ? (
          <Text variant="small" numberOfLines={2} className="mt-1.5">
            {provider.description}
          </Text>
        ) : null}

        <View className="mt-3 flex-row items-center gap-3">
          {provider.category ? (
            <View className="rounded-full px-2 py-0.5">
              <Text className="text-[11px] capitalize">
                {provider.category}
              </Text>
            </View>
          ) : null}
          {provider.location ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={11} color={c.inkMuted} />
              <Text className="text-[11px]">
                {provider.location}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
