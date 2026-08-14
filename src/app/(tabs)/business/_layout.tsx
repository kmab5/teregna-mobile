import { Stack } from "expo-router";

/**
 * The provider surface gets its own stack inside the Business tab.
 *
 * This resolves the open question from LOG.md: a separate stack rather than more
 * tabs. A provider working a shift is running their shop, not browsing the app,
 * so the section carries its own chrome - but nesting it in the existing tab bar
 * keeps one way home and avoids a second row of navigation eating the screen.
 */
export default function BusinessLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
