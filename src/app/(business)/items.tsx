import { useState } from "react";
import { FlatList, Pressable, Switch, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Package,
  PackageX,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { BusinessScreen } from "@/components/teregna/business-screen";
import { useProviderItems } from "@/lib/queries";
import { deleteItem, reorderItems, setItemVisible, upsertItem } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT, useLocale } from "@/i18n/provider";
import { makeFormat } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ItemView, Provider } from "@/lib/database.types";

export default function ItemsScreen() {
  return <BusinessScreen>{(p) => <Items provider={p} />}</BusinessScreen>;
}

function Items({ provider }: { provider: Provider }) {
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const qc = useQueryClient();
  const toast = useToast();
  const key = qk.providerItems(provider.id);

  const { data } = useProviderItems(provider.id);
  const items = data ?? [];

  const [editing, setEditing] = useState<ItemView | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ItemView | null>(null);

  const toggle = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      setItemVisible(id, visible),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setConfirmDelete(null);
      toast(t("it.removedTitle"), { body: t("it.removedBody") });
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  /**
   * Up/down buttons rather than drag: dragging is unusable by keyboard, awkward
   * with a screen reader, and fiddly one-handed - which is how a provider holds
   * the phone. Optimistic so the row moves under the finger, rolled back on
   * failure.
   */
  const reorder = useMutation({
    mutationFn: (ordered: ItemView[]) =>
      reorderItems(provider.id, ordered.map((i) => i.id)),
    onMutate: async (ordered) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ItemView[]>(key);
      qc.setQueryData<ItemView[]>(key, ordered);
      return { previous };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast(t(errorKey(e) as never), { tone: "error" });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next);
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        className="flex-1"
        contentContainerClassName="px-5 pb-7 gap-2 pt-4"
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <Text variant="small">{t("it.subtitle")}</Text>
            <Button
              title={t("it.add")}
              onPress={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
              icon={<Plus size={17} color="#FFFFFF" />}
            />
            {items.length > 0 ? (
              <Text variant="small">{t("it.orderNote")}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Card className={cn("gap-3", !item.is_visible && "opacity-70")}>
            <View className="flex-row items-center gap-3">
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("it.moveUp", { name: item.name })}
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                  hitSlop={4}
                  className={cn("px-1 py-0.5", index === 0 && "opacity-30")}
                >
                  <ChevronUp size={17} color="#5B517A" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("it.moveDown", { name: item.name })}
                  disabled={index === items.length - 1}
                  onPress={() => move(index, 1)}
                  hitSlop={4}
                  className={cn(
                    "px-1 py-0.5",
                    index === items.length - 1 && "opacity-30",
                  )}
                >
                  <ChevronDown size={17} color="#5B517A" />
                </Pressable>
              </View>

              <Text variant="mono" className="w-4 text-[13px]">
                {index + 1}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("it.edit", { name: item.name })}
                onPress={() => {
                  setEditing(item);
                  setSheetOpen(true);
                }}
                className="flex-1"
              >
                <Text className="font-medium">{item.name}</Text>
                {item.description ? (
                  <Text variant="small" numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </Pressable>

              <View className="items-end">
                <Text variant="mono" className="text-[13px]">
                  {fmt.money(item.price, item.currency)}
                </Text>
                {item.stock !== null ? (
                  item.is_depleted ? (
                    <View className="mt-0.5 flex-row items-center gap-1">
                      <PackageX size={11} color="#B45309" />
                      <Text className="text-[11px] text-warning dark:text-d-warning">
                        {t("stock.depleted")}
                      </Text>
                    </View>
                  ) : (
                    <Text className="mt-0.5 font-mono text-[11px] text-ink-muted dark:text-d-ink-muted">
                      {t.plural("stock.left", item.available ?? 0)}
                    </Text>
                  )
                ) : null}
              </View>
            </View>

            <View className="flex-row items-center gap-3 border-t border-border pt-2.5 dark:border-d-border">
              <Switch
                value={item.is_visible}
                onValueChange={(v) => toggle.mutate({ id: item.id, visible: v })}
                accessibilityLabel={
                  item.is_visible
                    ? t("it.hideAria", { name: item.name })
                    : t("it.showAria", { name: item.name })
                }
                trackColor={{ true: "#15803D", false: "#E6DEF7" }}
                thumbColor="#FFFFFF"
              />
              {item.is_visible ? (
                <Eye size={15} color="#15803D" />
              ) : (
                <EyeOff size={15} color="#5B517A" />
              )}

              <View className="flex-1" />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("it.edit", { name: item.name })}
                onPress={() => {
                  setEditing(item);
                  setSheetOpen(true);
                }}
                hitSlop={6}
                className="h-11 w-11 items-center justify-center rounded-sm"
              >
                <Pencil size={16} color="#6D28D9" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("it.removeAria", { name: item.name })}
                onPress={() => setConfirmDelete(item)}
                hitSlop={6}
                className="h-11 w-11 items-center justify-center rounded-sm"
              >
                <Trash2 size={16} color="#B91C1C" />
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card className="items-center py-10">
            <Package size={28} color="#5B517A" />
            <Text variant="title" className="mt-3">
              {t("it.emptyTitle")}
            </Text>
            <Text variant="small" className="mt-1 text-center">
              {t("it.emptyBody")}
            </Text>
          </Card>
        }
      />

      {/* Keyed so the form remounts on every open: without it, abandoning an
          edit and reopening the same item showed the discarded values. */}
      <ItemSheet
        key={`${sheetOpen}-${editing?.id ?? "new"}`}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        item={editing}
        providerId={provider.id}
        onSaved={() => qc.invalidateQueries({ queryKey: key })}
      />

      <Sheet
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={t("it.confirmTitle", { name: confirmDelete?.name ?? "" })}
      >
        <Text variant="small">{t("it.confirmBody")}</Text>
        <Text variant="small">{t("it.confirmHint")}</Text>
        <View className="flex-row gap-2">
          <Button
            title={t("it.keepIt")}
            variant="outline"
            className="flex-1"
            onPress={() => setConfirmDelete(null)}
          />
          <Button
            title={remove.isPending ? t("it.removing") : t("it.remove")}
            variant="destructive"
            className="flex-1"
            loading={remove.isPending}
            onPress={() => confirmDelete && remove.mutate(confirmDelete.id)}
          />
        </View>
      </Sheet>
    </>
  );
}

function ItemSheet({
  open,
  onClose,
  item,
  providerId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: ItemView | null;
  providerId: string;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();

  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [duration, setDuration] = useState(
    item?.duration_minutes != null ? String(item.duration_minutes) : "",
  );
  const [stock, setStock] = useState(item?.stock != null ? String(item.stock) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [visible, setVisible] = useState(item?.is_visible ?? true);

  const save = useMutation({
    mutationFn: () =>
      upsertItem({
        ...(item ? { id: item.id } : { provider_id: providerId }),
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : null,
        duration_minutes: duration ? Number(duration) : null,
        // Blank means stop counting, which the RPC distinguishes from omitted.
        stock: stock.trim() === "" ? null : Number(stock),
        is_visible: visible,
      }),
    onSuccess: () => {
      onSaved();
      onClose();
      toast(item ? t("it.updated") : t("it.added"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item ? t("it.editTitle", { name: item.name }) : t("it.addTitle")}
    >
      <Field
        label={t("it.name")}
        value={name}
        onChangeText={setName}
        placeholder={t("it.namePlaceholder")}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field
            label={t("it.price")}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="150"
            mono
          />
        </View>
        <View className="flex-1">
          <Field
            label={t("it.minutes")}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="30"
            mono
          />
        </View>
      </View>
      <Text variant="small" className="-mt-2">
        {t("it.minutesHint")}
      </Text>

      <Field
        label={t("stock.label")}
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
        placeholder={t("stock.untracked")}
        hint={t("it.stockHint")}
        mono
      />

      <Field
        label={t("it.description")}
        value={description}
        onChangeText={setDescription}
        placeholder={t("it.descriptionPlaceholder")}
        multiline
        className="h-20 py-3"
      />

      <View className="flex-row items-center justify-between rounded-sm border border-border p-3 dark:border-d-border">
        <View className="flex-1 pr-3">
          <Text className="font-medium text-[14px]">{t("it.visible")}</Text>
          <Text variant="small">{t("it.visibleHint")}</Text>
        </View>
        <Switch
          value={visible}
          onValueChange={setVisible}
          trackColor={{ true: "#15803D", false: "#E6DEF7" }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View className="flex-row gap-2 pb-2">
        <Button
          title={t("common.cancel")}
          variant="outline"
          className="flex-1"
          onPress={onClose}
        />
        <Button
          title={
            save.isPending ? t("common.saving") : item ? t("common.save") : t("it.add")
          }
          className="flex-1"
          loading={save.isPending}
          disabled={!name.trim()}
          onPress={() => save.mutate()}
        />
      </View>
    </Sheet>
  );
}
