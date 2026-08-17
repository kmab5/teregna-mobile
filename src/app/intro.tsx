import { useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Compass, ListOrdered, Store } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/teregna/language-toggle";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

export const INTRO_SEEN_KEY = "teregna_intro_seen";

const SLIDES = [
  { icon: Compass, titleKey: "intro.1.title", bodyKey: "intro.1.body" },
  { icon: ListOrdered, titleKey: "intro.2.title", bodyKey: "intro.2.body" },
  { icon: Store, titleKey: "intro.3.title", bodyKey: "intro.3.body" },
] as const;

/**
 * First-run introduction.
 *
 * Three slides, skippable from the first one. Nobody is required to read it, and
 * an intro that cannot be dismissed is a wall in front of the product rather
 * than a welcome.
 *
 * The language toggle sits on this screen because it is the first thing anyone
 * sees: an Amharic speaker should not have to read three English slides to reach
 * the setting that would have made them Amharic.
 */
export default function Intro() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const width = Dimensions.get("window").width;

  async function finish() {
    // Recorded before navigating, so a crash on the way out does not mean
    // seeing this again on every launch.
    await SecureStore.setItemAsync(INTRO_SEEN_KEY, "1").catch(() => {});
    router.replace("/(customer)/browse");
  }

  function next() {
    if (index >= SLIDES.length - 1) return void finish();
    const to = index + 1;
    setIndex(to);
    scrollRef.current?.scrollTo({ x: to * width, animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  }

  const last = index === SLIDES.length - 1;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg dark:bg-d-bg">
      <View className="h-12 flex-row items-center justify-between px-5">
        <LanguageToggle />
        <Pressable
          accessibilityRole="button"
          onPress={finish}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text variant="small" className="font-medium">
            {t("intro.skip")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="flex-1"
      >
        {SLIDES.map(({ icon: Icon, titleKey, bodyKey }) => (
          <View
            key={titleKey}
            style={{ width }}
            className="flex-1 items-center justify-center px-9"
          >
            <View className="h-24 w-24 items-center justify-center rounded-full bg-muted dark:bg-d-muted">
              <Icon size={40} color={c.primary} />
            </View>
            <Text variant="display" className="mt-8 text-center">
              {t(titleKey)}
            </Text>
            <Text variant="body" className="mt-3 text-center text-ink-muted dark:text-d-ink-muted">
              {t(bodyKey)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="gap-6 px-5 pb-4">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((s, i) => (
            <View
              key={s.titleKey}
              className={cn(
                "h-2 rounded-full",
                i === index
                  ? "w-6 bg-primary dark:bg-d-primary"
                  : "w-2 bg-border dark:bg-d-border",
              )}
            />
          ))}
        </View>

        <Button
          title={last ? t("intro.start") : t("intro.next")}
          size="lg"
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}
