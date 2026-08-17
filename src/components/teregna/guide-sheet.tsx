import { View } from "react-native";
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
 * Kept in a sheet rather than a screen so it can be opened from anywhere and
 * dismissed with a swipe. It covers both sides of the product, because everyone
 * has one account and a customer can become a provider without signing up again.
 */
export function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const c = useThemeColors();

  return (
    <Sheet open={open} onClose={onClose} title={t("guide.title")}>
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
      <View className="h-2" />
    </Sheet>
  );
}

function Section({ label }: { label: string }) {
  return (
    <Text className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
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
  return (
    <View className="flex-row gap-3">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-muted dark:bg-d-muted">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-[15px]">{title}</Text>
        <Text variant="small" className="mt-0.5">
          {body}
        </Text>
      </View>
    </View>
  );
}
