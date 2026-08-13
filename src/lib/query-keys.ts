/**
 * Query keys mirror the data so realtime can invalidate precisely rather than
 * blowing away the whole cache on every event.
 */
export const qk = {
  categories: () => ["categories"] as const,
  discovery: (search: string, category: string | null) =>
    ["discovery", search, category] as const,
  provider: (id: string) => ["provider", id] as const,
  providerItems: (id: string) => ["provider-items", id] as const,
  myProvider: () => ["my-provider"] as const,
  queue: (providerId: string) => ["queue", providerId] as const,
  archive: (providerId: string) => ["archive", providerId] as const,
  myRequests: () => ["my-requests"] as const,
  analytics: (providerId: string, days: number) =>
    ["analytics", providerId, days] as const,
  profile: () => ["profile"] as const,
};
