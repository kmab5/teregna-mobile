import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { qk } from "./query-keys";
import * as rpc from "./rpc";
import type {
  ArchiveRow,
  ItemView,
  MyRequest,
  Profile,
  Provider,
  ProviderPublic,
  QueueRow,
} from "./database.types";

/* ================================================================ reads === */

export function useDiscovery(search: string, category: string | null) {
  return useQuery({
    queryKey: qk.discovery(search, category),
    queryFn: async (): Promise<ProviderPublic[]> => {
      let q = supabase.from("provider_public").select("*").order("name");
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (category) q = q.eq("category", category);
      const { data, error } = await q.limit(60);
      if (error) throw error;
      return (data ?? []) as ProviderPublic[];
    },
    staleTime: 15_000,
  });
}

/**
 * The categories that actually exist, read from live providers.
 *
 * Category is free text, so a hardcoded list offers filters nobody uses and
 * hides ones that do exist.
 */
export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("provider_public")
        .select("category")
        .not("category", "is", null);
      if (error) throw error;
      const seen = new Map<string, string>();
      for (const row of (data ?? []) as { category: string | null }[]) {
        const value = row.category?.trim();
        if (!value) continue;
        const key = value.toLowerCase();
        if (!seen.has(key)) seen.set(key, value);
      }
      return [...seen.values()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
    },
    staleTime: 5 * 60_000,
  });
}

/** Items with queue-aware availability. `available` cannot be derived client-side. */
export function useProviderItems(providerId: string | undefined) {
  return useQuery({
    queryKey: qk.providerItems(providerId ?? ""),
    enabled: Boolean(providerId),
    queryFn: async (): Promise<ItemView[]> => {
      const { data, error } = await supabase
        .from("items_view")
        .select("*")
        .eq("provider_id", providerId!)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as ItemView[];
    },
    staleTime: 15_000,
  });
}

export function useMyProvider() {
  return useQuery({
    queryKey: qk.myProvider(),
    queryFn: async () => (await rpc.myProvider()) as Provider | null,
    staleTime: 30_000,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile(),
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

/* ============================================================= realtime === */

/**
 * Channel topics must be unique per subscription instance.
 *
 * `supabase.channel(topic)` RETURNS AN EXISTING channel when one with that topic
 * is already registered - it does not create a second one. React re-runs effects
 * (StrictMode double-mounts in dev, and any dependency change in production), and
 * because this subscription is asynchronous, a second run can reach
 * `.channel(topic)` before the first run\'s cleanup has removed it. It then gets
 * back a channel that is already subscribed, and `.on()` throws:
 *
 *   cannot add `postgres_changes` callbacks for realtime:queue:<id> after subscribe()
 *
 * A unique suffix makes that collision impossible. Cleanup removes the exact
 * instance it created, so nothing leaks.
 */
let channelSeq = 0;
const nextTopic = (base: string) => `${base}:${++channelSeq}`;

/**
 * Subscribe to `requests` with the socket authenticated.
 *
 * The session loads asynchronously from SecureStore, so a channel opened during
 * the first render can connect before the session exists. It then subscribes as
 * `anon`, RLS filters every event, and the feed looks connected while delivering
 * nothing. Waiting for the session and calling setAuth first is what prevents
 * that - the same failure we hit on web.
 */
async function subscribeToRequests(opts: {
  name: string;
  filter: string;
  onChange: () => void;
}): Promise<RealtimeChannel | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  await supabase.realtime.setAuth(session.access_token);

  return supabase
    .channel(nextTopic(opts.name))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "requests", filter: opts.filter },
      () => opts.onChange(),
    )
    .subscribe((status) => {
      if (__DEV__) console.log(`[realtime] ${opts.name}: ${status}`);
    });
}

/**
 * Re-read on foreground.
 *
 * A phone suspends the socket when backgrounded, so events during that window
 * are simply lost. Refetching on resume is not an optimisation here - without it
 * a provider reopening the app sees a stale queue.
 */
function useRefetchOnForeground(onForeground: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") onForeground();
    });
    return () => sub.remove();
  }, [onForeground]);
}

export function useProviderQueue(providerId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.queue(providerId ?? ""),
    enabled: Boolean(providerId),
    queryFn: async (): Promise<QueueRow[]> => {
      const { data, error } = await supabase
        .from("provider_queue")
        .select("*")
        .order("position");
      if (error) throw error;
      return (data ?? []) as QueueRow[];
    },
    // Safety net. Realtime is the fast path but depends on the socket staying
    // authenticated, which is outside this app's control.
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!providerId) return;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    subscribeToRequests({
      name: `queue:${providerId}`,
      filter: `provider_id=eq.${providerId}`,
      onChange: () => {
        qc.invalidateQueries({ queryKey: qk.queue(providerId) });
        qc.invalidateQueries({ queryKey: qk.archive(providerId) });
        qc.invalidateQueries({ queryKey: qk.providerItems(providerId) });
      },
    })
      .then((ch) => {
        // Resolving after unmount is normal, not an error - tear it straight
        // down rather than leaving an orphan subscribed.
        if (cancelled && ch) void supabase.removeChannel(ch);
        else channel = ch;
      })
      .catch(() => {
        // A failed subscription must not surface as an unhandled rejection.
      });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [providerId, qc]);

  useRefetchOnForeground(() => {
    if (providerId) qc.invalidateQueries({ queryKey: qk.queue(providerId) });
  });

  return query;
}

export function useProviderArchive(providerId: string | undefined) {
  return useQuery({
    queryKey: qk.archive(providerId ?? ""),
    enabled: Boolean(providerId),
    queryFn: async (): Promise<ArchiveRow[]> => {
      const { data, error } = await supabase
        .from("provider_archive")
        .select("*")
        .order("archived_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ArchiveRow[];
    },
  });
}

export function useMyRequests(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.myRequests(),
    queryFn: async (): Promise<MyRequest[]> => {
      const { data, error } = await supabase
        .from("my_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyRequest[];
    },
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (!userId) return;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    subscribeToRequests({
      name: `my-requests:${userId}`,
      filter: `receiver_id=eq.${userId}`,
      onChange: () => qc.invalidateQueries({ queryKey: qk.myRequests() }),
    })
      .then((ch) => {
        if (cancelled && ch) void supabase.removeChannel(ch);
        else channel = ch;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  useRefetchOnForeground(() =>
    qc.invalidateQueries({ queryKey: qk.myRequests() }),
  );

  return query;
}

export function useAnalytics(providerId: string | undefined, days: number) {
  return useQuery({
    queryKey: qk.analytics(providerId ?? "", days),
    enabled: Boolean(providerId),
    queryFn: () => {
      const end = new Date();
      const start = new Date(end.getTime() - days * 86_400_000);
      return rpc.providerAnalytics(providerId!, start.toISOString(), end.toISOString());
    },
    staleTime: 60_000,
  });
}
