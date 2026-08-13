import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "./text";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  className,
  mono,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  mono?: boolean;
}) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="font-medium text-[14px]">{label}</Text> : null}
      <TextInput
        // The placeholder must clear 4.5:1 like body text, so it uses the muted
        // ink token rather than the platform default grey.
        placeholderTextColor="#5B517A"
        className={cn(
          "h-12 rounded-sm border px-3 text-[16px]",
          "border-border bg-surface text-ink",
          "dark:border-d-border dark:bg-d-surface dark:text-d-ink",
          mono && "font-mono",
          error && "border-destructive dark:border-d-destructive",
          className,
        )}
        {...props}
      />
      {error ? (
        <Text className="text-[13px] text-destructive dark:text-d-destructive">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
}
