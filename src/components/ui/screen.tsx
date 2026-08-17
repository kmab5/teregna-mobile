import { ScrollView, View, type ViewProps } from "react-native";
import { Text } from "./text";
import { TopBar } from "./top-bar";
import { cn } from "@/lib/cn";

/**
 * Page shell.
 *
 * `px-5` (20px), not 16: at 16 the content sat close enough to the edge to feel
 * cramped and, on curved-screen phones, to be genuinely awkward to tap.
 *
 * `edges` excludes the bottom because the tab bar already occupies it - adding
 * safe-area padding there too leaves a visible dead strip.
 */
export function Screen({
  title,
  subtitle,
  children,
  scroll = false,
  right,
  topBar = false,
  topBarRight,
  className,
  contentClassName,
  ...props
}: ViewProps & {
  title?: string;
  subtitle?: string;
  /** Wrap children in a ScrollView. Do not use with a FlatList inside. */
  scroll?: boolean;
  right?: React.ReactNode;
  /** The app bar. Off for screens that supply their own chrome. */
  topBar?: boolean;
  topBarRight?: React.ReactNode;
  contentClassName?: string;
}) {
  const header = title ? (
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
  ) : null;

  return (
    <View className="flex-1 bg-bg dark:bg-d-bg">
      {topBar ? <TopBar right={topBarRight} /> : null}
      <View className={cn("flex-1 px-5", className)} {...props}>
        {header}
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
