import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

/**
 * Sign in with Google on native.
 *
 * The web flow relies on the browser handing the code back via
 * window.location, which does not exist here. Instead:
 *
 *   1. ask Supabase for the provider URL with skipBrowserRedirect
 *   2. open it in an in-app browser session that we control
 *   3. Google returns to our deep link, we pull the code out, and exchange it
 *
 * openAuthSessionAsync is what makes the browser close itself on redirect. A
 * plain openBrowserAsync leaves the user staring at a blank tab having already
 * signed in.
 */
export async function signInWithGoogle(): Promise<
  { ok: true } | { ok: false; reason: "cancelled" | "failed" }
> {
  const redirectTo = Linking.createURL("/auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Always show the chooser: a shared phone should not silently sign in as
      // whoever used it last.
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) return { ok: false, reason: "failed" };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    return { ok: false, reason: "cancelled" };
  }
  if (result.type !== "success") return { ok: false, reason: "failed" };

  const params = extractParams(result.url);

  if (params.error) {
    return {
      ok: false,
      reason: params.error === "access_denied" ? "cancelled" : "failed",
    };
  }

  if (params.code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(params.code);
    return exchangeError ? { ok: false, reason: "failed" } : { ok: true };
  }

  // Implicit flow fallback: tokens arrive in the fragment rather than a code.
  if (params.access_token && params.refresh_token) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return setError ? { ok: false, reason: "failed" } : { ok: true };
  }

  return { ok: false, reason: "failed" };
}

/** Params can arrive in the query string or the fragment; check both. */
function extractParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const [, rest = ""] = url.split("?");
  const [query = "", fragment = ""] = rest.split("#");
  for (const chunk of [query, fragment, url.split("#")[1] ?? ""]) {
    if (!chunk) continue;
    for (const pair of chunk.split("&")) {
      const [k, v] = pair.split("=");
      if (k && v && !out[k]) out[k] = decodeURIComponent(v);
    }
  }
  return out;
}
