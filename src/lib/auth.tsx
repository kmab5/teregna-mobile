import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  /** False until the stored session has been read. Guards premature redirects. */
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

/**
 * Session state.
 *
 * On the web the session arrives with the server-rendered HTML. Here it has to
 * be read out of SecureStore first, so `ready` matters: routing on
 * `session === null` before the read completes would bounce an already
 * signed-in user to the login screen on every cold start.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Keep the realtime socket's token current, or subscriptions silently
      // stop delivering after a refresh.
      if (next?.access_token) void supabase.realtime.setAuth(next.access_token);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, ready }),
    [session, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
