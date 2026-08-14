import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Loading placeholder.
 *
 * A shaped placeholder beats a spinner because it tells you what is coming and
 * stops the layout jumping when it arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  const [pulse] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      <View className={cn("rounded-sm bg-muted dark:bg-d-muted", className)} />
    </Animated.View>
  );
}

/** Stand-in for a list of cards, sized to what actually loads there. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-md" />
      ))}
    </View>
  );
}
