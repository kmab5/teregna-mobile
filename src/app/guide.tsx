import { Pressable, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { GuideBody } from "@/components/teregna/guide-sheet";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

/**
 * The guide as a page rather than a sheet.
 *
 * It is reached from the drawer now, and a sheet opened from a drawer means two
 * overlays stacked on each other - which on Android makes the back button
 * ambiguous.
 */
export default function GuideScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1" style={{ backgroundColor: c.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="h-12 flex-row items-center border-b px-2" style={{ borderColor: c.border }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} color={c.primary} />
        </Pressable>
        <Text className="font-display text-[16px] font-semibold">{t("guide.title")}</Text>
      </View>
      <GuideBody />
    </SafeAreaView>
  );
}
