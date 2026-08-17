import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";
import { INTRO_SEEN_KEY } from "./intro";

/**
 * Entry point.
 *
 * Browsing is public, so a signed-out visitor lands on discovery rather than a
 * login wall - sign-in is deferred until it buys something.
 *
 * First launch shows the introduction instead. The check is a stored flag rather
 * than "is there a session", because someone who signs out has still seen it.
 */
export default function Index() {
  const { ready } = useAuth();
  const [seenIntro, setSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(INTRO_SEEN_KEY)
      .then((v) => {
        if (!cancelled) setSeenIntro(v === "1");
      })
      // A storage failure must not trap anyone on a blank screen; assume seen.
      .catch(() => {
        if (!cancelled) setSeenIntro(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || seenIntro === null) return null;
  return <Redirect href={seenIntro ? "/(tabs)/browse" : "/intro"} />;
}
