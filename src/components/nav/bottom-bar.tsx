import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

export interface TabMeta {
  name: string;
  labelKey: string;
  icon: LucideIcon;
}

/**
 * The props expo-router's tab navigator hands a custom tabBar.
 *
 * Taken from expo-router itself rather than @react-navigation: as of SDK 56
 * expo-router vendors its own copy, and importing the public package is a build
 * error. Deriving the type from the component keeps it correct through upgrades
 * instead of drifting from a hand-written shape.
 */
type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/**
 * The bottom bar.
 *
 * A pill fades and stretches behind the active icon rather than every item
 * animating independently: one moving object reads as navigation, five reads as
 * noise. Icons spring slightly on selection, which confirms a tap landed without
 * waiting for the screen behind to finish.
 */
export function BottomBar({
  state,
  navigation,
  tabs,
}: TabBarProps & { tabs: TabMeta[] }) {
  const t = useT();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t"
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}
    >
      {state.routes.map((route, index) => {
        const meta = tabs.find((tab) => tab.name === route.name);
        if (!meta) return null;
        const focused = state.index === index;

        return (
          <TabButton
            key={route.key}
            focused={focused}
            label={t(meta.labelKey as never)}
            Icon={meta.icon}
            colors={c}
            onPress={() => {
              // Emitted so a screen can intercept a re-tap (scroll to top,
              // reset a stack) before navigation happens.
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              } as never) as unknown as { defaultPrevented: boolean };

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            }}
          />
        );
      })}
    </View>
  );
}

function TabButton({
  focused,
  label,
  Icon,
  colors,
  onPress,
}: {
  focused: boolean;
  label: string;
  Icon: LucideIcon;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const pill = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 16, stiffness: 220 });
    pill.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, scale, pill]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: pill.value,
    transform: [{ scaleX: 0.7 + pill.value * 0.3 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1 }}
      className="items-center justify-center"
    >
      <View className="h-8 w-16 items-center justify-center">
        <Animated.View
          pointerEvents="none"
          style={[pillStyle, { backgroundColor: colors.pillPrimaryBg }]}
          className="absolute h-8 w-16 rounded-full"
        />
        <Animated.View style={iconStyle}>
          <Icon size={20} color={focused ? colors.pillPrimaryText : colors.inkMuted} />
        </Animated.View>
      </View>
      <Text
        numberOfLines={1}
        className={cn(
          "mt-0.5 text-[11px]",
          focused
            ? "font-medium"
            : "",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
