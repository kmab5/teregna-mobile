import { View, type ViewProps } from "react-native";
import { useThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

export function Card({ className, style, ...props }: ViewProps) {
  const c = useThemeColors();
  return (
    <View
      className={cn("rounded-md border p-4", className)}
      style={[{ backgroundColor: c.surface, borderColor: c.border }, style]}
      {...props}
    />
  );
}
