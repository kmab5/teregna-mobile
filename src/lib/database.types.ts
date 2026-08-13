/**
 * Types for the Teregna schema.
 *
 * REGENERATE, DO NOT HAND-EDIT:
 *   npm run types      (in the teregna-backend repo)
 * then copy the output here. CI in the backend repo fails if it drifts.
 *
 * This copy was written against migrations through
 * 20260806091000_advisor_hardening.
 */

export type RequestStatus = "queued" | "in_progress" | "completed" | "cancelled";

/** A line item, snapshotted at request time. Name and price never change after. */
export interface RequestItemSnapshot {
  item_id: string | null;
  name: string;
  price: number | null;
  quantity: number;
}

/** Return of delete_my_account(). */
export interface AccountDeletionResult {
  cancelled_requests: number;
  orphaned_providers: number;
  /** False if the auth row survived; personal data is scrubbed either way. */
  auth_user_deleted: boolean;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  locale: "en" | "am";
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  is_visible: boolean;
  display_order: number;
  /**
   * Typical minutes to complete. Optional. Collected now; reserved for
   * estimated wait times.
   */
  duration_minutes: number | null;
  /** Optional physical stock. Null = not tracked. Never blocks a request. */
  stock: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * public.items_view — items plus derived availability.
 *
 * `available` is what is left AT THE END OF THE CURRENT QUEUE, not raw stock:
 * three left with four already queued means the next person gets nothing.
 */
export interface ItemView extends Item {
  /** Quantity the active queue has already committed. */
  committed: number;
  /** stock - committed, floored at 0. Null when stock is not tracked. */
  available: number | null;
  is_depleted: boolean;
}

/** public.provider_public - discovery. Queue COUNT only, never identities. */
export interface ProviderPublic {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  is_active: boolean;
  queue_length: number;
}

/** public.provider_queue - the owning provider's live queue. */
export interface QueueRow {
  id: string;
  provider_id: string;
  receiver_id: string | null;
  status: RequestStatus;
  seq: number;
  note: string | null;
  created_at: string;
  started_at: string | null;
  receiver_name: string;
  receiver_avatar_url: string | null;
  /** Derived at read time from seq. Never stored. */
  position: number;
  wait_time: string;
  items: RequestItemSnapshot[];
}

/** public.provider_archive - completed and cancelled. */
export interface ArchiveRow {
  id: string;
  provider_id: string;
  receiver_id: string | null;
  status: RequestStatus;
  seq: number;
  note: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  receiver_name: string;
  items: RequestItemSnapshot[];
}

/** public.my_requests - the caller's own requests. */
export interface MyRequest {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_cover_url: string | null;
  status: RequestStatus;
  note: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  /** Counts EVERY request ahead, not just the caller's. Null once terminal. */
  position: number | null;
  items: RequestItemSnapshot[];
}

/** Return of provider_analytics(). One call renders the whole dashboard. */
export interface Analytics {
  range: { start: string; end: string; timezone: string };
  totals: { total: number; completed: number; cancelled: number; active: number };
  current_queue_length: number;
  completion_rate: number | null;
  avg_time_to_complete_seconds: number;
  median_time_to_complete_seconds: number;
  over_time: { day: string; count: number }[];
  by_item: { item: string; count: number; quantity: number }[];
  busiest_hours: { hour: number; count: number }[];
}

export const ACTIVE_STATUSES: RequestStatus[] = ["queued", "in_progress"];
export const TERMINAL_STATUSES: RequestStatus[] = ["completed", "cancelled"];
