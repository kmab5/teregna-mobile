import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "./text";
import { useThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  className,
  mono,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  mono?: boolean;
}) {
  const c = useThemeColors();

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-[14px] font-medium">{label}</Text>
      ) : null}
      <TextInput
        // The placeholder must clear 4.5:1 like body text, so it uses the muted
        // ink token rather than the platform default grey.
        placeholderTextColor={c.inkMuted}
        className={cn("h-12 rounded-sm border px-3 text-[16px]", mono && "font-mono", className)}
        style={[
          {
            backgroundColor: c.surface,
            borderColor: error ? c.destructive : c.border,
            color: c.ink,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
}
