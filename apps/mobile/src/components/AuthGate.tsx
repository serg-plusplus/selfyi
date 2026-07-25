import { Redirect } from "expo-router";
import { type ReactNode } from "react";
import { useAuth } from "@/sdk";
import { LoadingDots } from "./LoadingDots";

/**
 * The World ID gate (Decision 13.1): nothing renders until the user passed
 * Selfie Check (has a session) AND picked a handle. Wraps the tab stack.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") return <LoadingDots fullscreen />;
  if (status === "unauthed") return <Redirect href="/verify" />;
  if (user && !user.onboarded) return <Redirect href="/onboarding" />;
  return <>{children}</>;
}
