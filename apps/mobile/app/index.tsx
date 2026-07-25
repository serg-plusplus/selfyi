import { Redirect } from "expo-router";

/**
 * Entry route: "/" has no screen of its own — bounce straight to the feed.
 * AuthGate inside (tabs) then redirects unauthed users to /verify and
 * non-onboarded users to /onboarding, so this is the only routing decision
 * the root needs to make. Without this file Expo Router shows "Unmatched
 * Route" on launch (no index route matches "/").
 */
export default function Index() {
  return <Redirect href="/(tabs)/feed" />;
}
