import { useCallback } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn } from "react-native-reanimated";
import { usePathname, useRouter } from "expo-router";

/**
 * Horizontal swipe between sibling tabs.
 *
 * expo-router's tab navigator cuts straight from one screen to the next with no
 * gesture, and as of SDK 56 the pager-backed material tabs cannot be used - the
 * public @react-navigation packages are a build error against expo-router's
 * vendored copy. So the gesture is implemented directly.
 *
 * `activeOffsetX` means a mostly-vertical drag is left alone: without it, every
 * scroll through a list would fight the navigator.
 */
export function Swipeable({
  routes,
  children,
}: {
  /** Tab paths in bar order. Swiping moves one step along this list. */
  routes: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const go = useCallback(
    (direction: -1 | 1) => {
      const index = routes.findIndex((r) => pathname === r);
      if (index === -1) return;
      const next = index + direction;
      if (next < 0 || next >= routes.length) return;
      router.navigate(routes[next] as never);
    },
    [pathname, routes, router],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-16, 16])
    .onEnd((e) => {
      // Velocity as well as distance: a short flick is a deliberate swipe, and
      // requiring a long drag makes the gesture feel unresponsive.
      const far = Math.abs(e.translationX) > 70;
      const fast = Math.abs(e.velocityX) > 500;
      if (!far && !fast) return;
      go(e.translationX < 0 ? 1 : -1);
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={pan}>
      <View className="flex-1">{children}</View>
    </GestureDetector>
  );
}

/** Fades a screen in on focus, so a tab change is a transition rather than a cut. */
export function ScreenFade({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(160)} className="flex-1">
      {children}
    </Animated.View>
  );
}
