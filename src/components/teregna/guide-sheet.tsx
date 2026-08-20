import { ScrollView, View } from "react-native";
import {
  Archive,
  Compass,
  ListOrdered,
  Package,
  PackageX,
  Play,
  Send,
  Store,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Sheet } from "@/components/ui/sheet";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

const CUSTOMER = [
  { icon: Compass, titleKey: "guide.c1.title", bodyKey: "guide.c1.body" },
  { icon: Send, titleKey: "guide.c2.title", bodyKey: "guide.c2.body" },
  { icon: ListOrdered, titleKey: "guide.c3.title", bodyKey: "guide.c3.body" },
] as const;

const PROVIDER = [
  { icon: Package, titleKey: "guide.p1.title", bodyKey: "guide.p1.body" },
  { icon: Play, titleKey: "guide.p2.title", bodyKey: "guide.p2.body" },
  { icon: Archive, titleKey: "guide.p3.title", bodyKey: "guide.p3.body" },
  { icon: Store, titleKey: "guide.p4.title", bodyKey: "guide.p4.body" },
] as const;

/**
 * The guide.
 *
 * Covers both sides of the product, because everyone has one account and a
 * customer can become a provider without signing up again - someone reading this
 * may not yet know the second half applies to them.
 */
export function GuideSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t("guide.title")}>
      <Sections />
      <View className="h-2" />
    </Sheet>
  );
}

/** The same content as a scrollable page, for the drawer route. */
export function GuideBody() {
  return (
    <ScrollView
      className="flex-1 px-5"
      contentContainerClassName="py-4 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <Sections />
    </ScrollView>
  );
}

function Sections() {
  const t = useT();
  const c = useThemeColors();

  return (
    <>
      <Section label={t("guide.customer")} />
      {CUSTOMER.map(({ icon: Icon, titleKey, bodyKey }) => (
        <Row
          key={titleKey}
          icon={<Icon size={17} color={c.primary} />}
          title={t(titleKey)}
          body={t(bodyKey)}
        />
      ))}

      <Section label={t("guide.provider")} />
      {PROVIDER.map(({ icon: Icon, titleKey, bodyKey }) => (
        <Row
          key={titleKey}
          icon={<Icon size={17} color={c.primary} />}
          title={t(titleKey)}
          body={t(bodyKey)}
        />
      ))}

      <Section label={t("guide.stock")} />
      <Row
        icon={<PackageX size={17} color={c.warning} />}
        title={t("guide.stock")}
        body={t("guide.stockBody")}
      />
    </>
  );
}

function Section({ label }: { label: string }) {
  return (
    <Text variant="label" className="mt-2">
      {label}
    </Text>
  );
}

function Row({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const c = useThemeColors();
  return (
    <View className="flex-row gap-3">
      <View
        className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: c.softBg }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium">{title}</Text>
        <Text variant="small" className="mt-0.5">
          {body}
        </Text>
      </View>
    </View>
  );
}
