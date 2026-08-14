import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./text";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "info";

interface ToastMessage {
  title: string;
  body?: string;
  tone: Tone;
}

const ToastContext = createContext<
  ((title: string, opts?: { body?: string; tone?: Tone }) => void) | null
>(null);

/**
 * Lightweight toast.
 *
 * `Alert.alert` blocks the screen and needs dismissing, which is wrong for
 * confirming an action the person just took deliberately. This appears, states
 * what happened, and leaves.
 *
 * Anchored to the top: on a phone the bottom is covered by the tab bar and,
 * more importantly, by the thumb that just tapped the button.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  // useState with a lazy initialiser, not useRef(...).current: reading a ref
  // during render is what React's rules forbid, and the value only needs to be
  // stable, which this guarantees.
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (title: string, opts?: { body?: string; tone?: Tone }) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage({ title, body: opts?.body, tone: opts?.tone ?? "success" });
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, 2600);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={{ opacity, top: insets.top + 8 }}
          className="absolute left-5 right-5 z-50"
        >
          <View
            className={cn(
              "rounded-md border p-3.5",
              "border-border bg-surface dark:border-d-border dark:bg-d-surface",
            )}
            style={{
              shadowColor: "#2A1A4A",
              shadowOpacity: 0.14,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Text
              className={cn(
                "font-medium text-[15px]",
                message.tone === "error" &&
                  "text-destructive dark:text-d-destructive",
                message.tone === "success" && "text-accent dark:text-d-accent",
              )}
            >
              {message.title}
            </Text>
            {message.body ? (
              <Text variant="small" className="mt-0.5">
                {message.body}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
