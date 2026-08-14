import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Store } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BusinessNav } from "./business-nav";
import { useMyProvider } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useT } from "@/i18n/provider";
import type { Provider } from "@/lib/database.types";

/**
 * Shell for every provider screen.
 *
 * Handles the three states each of them would otherwise repeat: signed out,
 * still loading, and signed in without a business yet.
 */
export function BusinessScreen({
  children,
}: {
  children: (provider: Provider) => React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { data: provider, isPending } = useMyProvider();

  if (!user) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
        <View className="flex-1 justify-center px-5">
          <Card>
            <Text variant="title">{t("auth.provTitle")}</Text>
            <Text variant="small" className="mt-1">
              {t("auth.provSub")}
            </Text>
            <Button
              title={t("auth.signIn")}
              className="mt-4 self-start"
              onPress={() => router.push("/(auth)/sign-in")}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (isPending) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
        <BusinessNav provider={null} />
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
        <View className="flex-1 justify-center px-5">
          <Card className="items-center py-10">
            <Store size={28} color="#5B517A" />
            <Text variant="title" className="mt-3 text-center">
              {t("ob.bTitle")}
            </Text>
            <Text variant="small" className="mt-1 text-center">
              {t("ob.bSubtitle")}
            </Text>
            <Button
              title={t("ob.openQueue")}
              className="mt-5"
              onPress={() => router.push("/business/onboarding" as never)}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <BusinessNav provider={provider} />
      <View className="flex-1">{children(provider)}</View>
    </SafeAreaView>
  );
}
