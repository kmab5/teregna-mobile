import { createContext, useContext, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { DrawerContent } from "./drawer-content";
import { useThemeColors } from "@/theme/colors";

interface Ctx {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const DrawerContext = createContext<Ctx | null>(null);

const WIDTH = Math.min(Dimensions.get("window").width * 0.82, 340);

/**
 * The navigation drawer.
 *
 * Built directly on Reanimated rather than swapping to a Drawer navigator,
 * because the two sides of the app have different tab sets: a navigator-level
 * drawer would have to be declared twice and kept in step. This one wraps the
 * whole tree once, so both modes get the identical panel and the switch inside
 * it can move between them without unmounting itself.
 *
 * The scrim is a real Pressable so tapping away closes it - the gesture people
 * try before looking for a button.
 */
export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const progress = useSharedValue(0);

  /*
   * Plain functions, not useCallback: React Compiler-era lint treats a shared
   * value written inside a memoised callback as a mutation of a captured value.
   * The provider re-renders rarely enough that memoising these buys nothing.
   */
  function open() {
    setIsOpen(true);
    progress.value = withTiming(1, { duration: 220 });
  }

  function close() {
    progress.value = withTiming(0, { duration: 200 });
    // Unmount after the animation so the panel does not vanish mid-slide.
    setTimeout(() => setIsOpen(false), 200);
  }

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -WIDTH + progress.value * WIDTH }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45,
  }));

  // Swipe the panel itself closed. Opening by edge-swipe is deliberately not
  // bound, because it would fight the horizontal tab swipe.
  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50 || e.velocityX < -500) close();
    })
    .runOnJS(true);

  // Not memoised: `open` and `close` are re-created each render, so a dependency
  // array either lies or defeats the memo. The provider re-renders only when the
  // drawer itself opens or closes, which is exactly when consumers should update.
  const value: Ctx = { open, close, isOpen };

  return (
    <DrawerContext.Provider value={value}>
      <View className="flex-1">
        {children}

        {isOpen ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[scrimStyle, { backgroundColor: "#000000" }]}
              className="absolute inset-0"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={close}
              className="absolute inset-0"
            />
            <GestureDetector gesture={pan}>
              <Animated.View
                style={[
                  panelStyle,
                  {
                    width: WIDTH,
                    backgroundColor: c.surface,
                    borderRightColor: c.border,
                    borderRightWidth: 1,
                  },
                ]}
                className="absolute bottom-0 left-0 top-0"
              >
                <DrawerContent onClose={close} />
              </Animated.View>
            </GestureDetector>
          </>
        ) : null}
      </View>
    </DrawerContext.Provider>
  );
}

export function useDrawer(): Ctx {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used inside <DrawerProvider>");
  return ctx;
}
