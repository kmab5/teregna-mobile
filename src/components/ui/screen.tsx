import { ScrollView, View, type ViewProps } from "react-native";
import { Text } from "./text";
import { useThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

/**
 * Page shell.
 *
 * 20px gutters: at 16 the content sat close enough to the edge to feel cramped
 * and, on curved-screen phones, to be awkward to tap.
 */
export function Screen({
  title,
  subtitle,
  children,
  scroll = false,
  right,
  className,
  contentClassName,
  ...props
}: ViewProps & {
  title?: string;
  subtitle?: string;
  /** Wrap children in a ScrollView. Do not use with a FlatList inside. */
  scroll?: boolean;
  right?: React.ReactNode;
  contentClassName?: string;
}) {
  const c = useThemeColors();

  return (
    <View className="flex-1" style={{ backgroundColor: c.bg }}>
      <View className={cn("flex-1 px-5", className)} {...props}>
        {title ? (
          <View className="flex-row items-start justify-between gap-3 pb-4 pt-4">
            <View className="flex-1">
              <Text variant="display">{title}</Text>
              {subtitle ? (
                <Text variant="small" className="mt-1">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
        ) : null}

        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName={cn("pb-7 gap-4", contentClassName)}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
