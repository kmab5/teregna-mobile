import { View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./text";
import { cn } from "@/lib/cn";

/**
 * Page shell.
 *
 * `edges` excludes the bottom by default because the tab bar already occupies
 * it - adding safe-area padding there too leaves a visible dead strip.
 */
export function Screen({
  title,
  subtitle,
  children,
  className,
  ...props
}: ViewProps & { title?: string; subtitle?: string }) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <View className={cn("flex-1 px-4", className)} {...props}>
        {title ? (
          <View className="pb-4 pt-2">
            <Text variant="display">{title}</Text>
            {subtitle ? (
              <Text variant="small" className="mt-1">
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}
