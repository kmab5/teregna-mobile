import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-md border border-border bg-surface p-4",
        "dark:border-d-border dark:bg-d-surface",
        className,
      )}
      {...props}
    />
  );
}
