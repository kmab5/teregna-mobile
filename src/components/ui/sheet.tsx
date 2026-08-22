import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Text } from "./text";
import { useThemeColors } from "@/theme/colors";

/**
 * Bottom sheet.
 *
 * Bottom-anchored rather than centred: the controls inside end up within thumb
 * reach, and the sheet rises from the same edge the keyboard does, so the two
 * do not fight over the middle of the screen.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Tapping the scrim closes, which is the gesture people try first. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onClose}
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      />
      <View
        className="rounded-t-lg border-t"
        style={{
          backgroundColor: c.surface,
          borderColor: c.border,
          paddingBottom: insets.bottom + 16,
          maxHeight: "88%",
        }}
      >
        <View className="flex-row items-start justify-between gap-3 px-5 pb-2 pt-5">
          <View className="flex-1">
            <Text variant="title">{title}</Text>
            {description ? (
              <Text variant="small" className="mt-1">
                {description}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <X size={18} color={c.inkMuted} />
          </Pressable>
        </View>
        <ScrollView
          className="px-5"
          contentContainerClassName="gap-4 pb-2"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
