import { supabase } from "./supabase";
import type {
  AccountDeletionResult,
  Analytics,
  Item,
  Profile,
  Provider,
} from "./database.types";

/**
 * Typed wrappers over the RPC surface.
 *
 * Identical in shape to the web app's, and deliberately so: the contract lives
 * in the database. Clients hold no INSERT/UPDATE/DELETE grant on `requests`, so
 * these functions are the only way a request can be written - from any platform.
 *
 * Each wrapper throws the bare error code; callers map it with errorKey().
 */
async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface RequestLine {
  item_id: string;
  quantity: number;
}

/**
 * @param idempotencyKey generated once per compose attempt and reused on retry.
 * Mobile needs this more than web does: a request sent as the app loses signal
 * will be retried, and without the key that is a duplicate in someone's queue.
 */
export function createRequest(input: {
  providerId: string;
  items: RequestLine[];
  note?: string | null;
  idempotencyKey: string;
}) {
  return rpc("create_request", {
    p_provider_id: input.providerId,
    p_items: input.items,
    p_note: input.note ?? null,
    p_idempotency_key: input.idempotencyKey,
  });
}

export const startRequest = (id: string) => rpc("start_request", { p_request_id: id });
export const finishRequest = (id: string) => rpc("finish_request", { p_request_id: id });
export const cancelRequest = (id: string) => rpc("cancel_request", { p_request_id: id });

export const restoreRequest = (id: string, mode: "back" | "original" = "back") =>
  rpc("restore_request", { p_request_id: id, p_mode: mode });

export const myProvider = () => rpc<Provider | null>("my_provider");

export const upsertProvider = (p: Partial<Provider>) =>
  rpc<Provider>("upsert_provider", { p });

export const setProviderActive = (providerId: string, active: boolean) =>
  rpc<Provider>("set_provider_active", { p_provider_id: providerId, p_active: active });

export const upsertItem = (p: Partial<Item> & { provider_id?: string }) =>
  rpc<Item>("upsert_item", { p });

export const setItemVisible = (itemId: string, visible: boolean) =>
  rpc<Item>("set_item_visible", { p_item_id: itemId, p_visible: visible });

export const reorderItems = (providerId: string, order: string[]) =>
  rpc<void>("reorder_items", { p_provider_id: providerId, p_order: order });

export const deleteItem = (itemId: string) =>
  rpc<void>("delete_item", { p_item_id: itemId });

export const upsertProfile = (p: Partial<Profile>) =>
  rpc<Profile>("upsert_profile", { p });

export const deleteMyAccount = () =>
  rpc<AccountDeletionResult>("delete_my_account");

export const providerAnalytics = (
  providerId: string,
  rangeStart?: string,
  rangeEnd?: string,
) =>
  rpc<Analytics>("provider_analytics", {
    p_provider_id: providerId,
    ...(rangeStart ? { p_range_start: rangeStart } : {}),
    ...(rangeEnd ? { p_range_end: rangeEnd } : {}),
  });
