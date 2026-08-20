import { useEffect, useState } from "react";
import { View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/i18n/provider";
import { useThemeColors } from "@/theme/colors";

/**
 * Offline notice.
 *
 * Without it, losing signal looks identical to an empty queue: the provider sees
 * nobody waiting and assumes nobody is. Saying "this is stale" is the difference
 * between a quiet morning and a missed customer.
 */
export function OfflineBanner() {
  const c = useThemeColors();
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` can be null while it is still being determined;
      // only treat an explicit false as offline, or the banner flashes on launch.
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  if (!offline) return null;

  return (
    <View className="flex-row items-center gap-2 px-5 py-2">
      <WifiOff size={14} color={c.onPrimary} />
      <Text className="flex-1 text-[13px] font-medium text-white">
        {t("offline.title")}
      </Text>
    </View>
  );
}
