import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

/**
 * Text that scrolls when it does not fit.
 *
 * Truncation loses the end of a name, which for a business is often the part
 * that distinguishes it ("Abebe Barbershop **Bole**"). Scrolling shows all of it
 * without letting the row grow and push the action button out of reach.
 *
 * It only animates when the content actually overflows - a name that fits stays
 * perfectly still, because motion with no purpose is just noise.
 */
export function MarqueeText({
  children,
  className,
  style,
}: {
  children: string;
  className?: string;
  style?: object;
}) {
  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);
  const offset = useSharedValue(0);

  const overflows = textW > containerW && containerW > 0;
  const distance = Math.max(textW - containerW, 0);

  useEffect(() => {
    if (!overflows) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }
    // Roughly 40px per second, so a long name is readable rather than a blur.
    const duration = Math.max((distance / 40) * 1000, 1200);
    offset.value = withRepeat(
      withDelay(
        1200,
        withTiming(-distance, { duration, easing: Easing.linear }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(offset);
  }, [overflows, distance, offset]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      className="overflow-hidden"
      onLayout={(e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width)}
    >
      <Animated.View style={animated}>
        <Text
          numberOfLines={1}
          className={className}
          style={style}
          onLayout={(e: LayoutChangeEvent) => setTextW(e.nativeEvent.layout.width)}
          // Measured at natural width; the container clips it.
          {...{ ellipsizeMode: "clip" as const }}
        >
          {children}
        </Text>
      </Animated.View>
    </View>
  );
}
