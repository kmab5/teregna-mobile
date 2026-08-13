import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

/**
 * Entry point.
 *
 * Browsing is public, so a signed-out visitor lands on discovery rather than a
 * login wall - the same "sign in only when it buys you something" rule the web
 * app follows.
 */
export default function Index() {
  const { ready } = useAuth();
  if (!ready) return null;
  return <Redirect href="/(tabs)/browse" />;
}
