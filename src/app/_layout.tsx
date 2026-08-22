import "../../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { useFonts } from "expo-font";
import { Outfit_600SemiBold } from "@expo-google-fonts/outfit";
import { WorkSans_400Regular, WorkSans_500Medium } from "@expo-google-fonts/work-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";
import { NotoSansEthiopic_400Regular } from "@expo-google-fonts/noto-sans-ethiopic";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";
import { DrawerProvider } from "@/components/nav/drawer";
import { PhoneGate } from "@/components/teregna/phone-gate";
import { configureAndroidChannel } from "@/lib/push";
import { I18nProvider, useLocale } from "@/i18n/provider";
import { ThemeProvider } from "@/theme/provider";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      // A phone loses connectivity constantly; a failed fetch should recover
      // when it comes back rather than leaving an empty screen.
      refetchOnReconnect: true,
    },
  },
});

function Gate({ children }: { children: React.ReactNode }) {
  const { ready: localeReady } = useLocale();

  const [fontsLoaded, fontError] = useFonts({
    Outfit_600SemiBold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    NotoSansEthiopic_400Regular,
  });

  // A font that fails to load must not hold the splash screen forever - the app
  // is perfectly usable with a system fallback.
  const canRender = localeReady && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (canRender) SplashScreen.hideAsync().catch(() => {});
  }, [canRender]);

  // The Android channel must exist before any notification arrives, or it is
  // delivered silently. Cheap and idempotent, so it runs on every launch.
  useEffect(() => {
    void configureAndroidChannel();
  }, []);

  if (!canRender) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
              <Gate>
                <DrawerProvider>
                <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    // A slide reads as "further in", which matches what these
                    // routes are: a provider, an order, the guide. The default
                    // cut gave no sense of depth and made Back feel arbitrary.
                    animation: "slide_from_right",
                    animationDuration: 220,
                    gestureEnabled: true,
                    contentStyle: { backgroundColor: "transparent" },
                  }}
                >
                  {/* Names must match the files under src/app exactly.
                      expo-router warns rather than errors on a mismatch, so a
                      stale name here is silent apart from a console line. */}
                  <Stack.Screen name="index" />
                  <Stack.Screen name="intro" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="(customer)" />
                  <Stack.Screen name="(business)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="p/[id]" />
                  <Stack.Screen name="order/[id]" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="guide" />
                </Stack>
                  <PhoneGate />
                </DrawerProvider>
              </Gate>
              </ToastProvider>
            </AuthProvider>
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
