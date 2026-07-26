import { Redirect } from "expo-router";
import { type ReactNode } from "react";
import { useAuth } from "@/sdk";
import { LoadingDots } from "./LoadingDots";

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") return <LoadingDots fullscreen />;
  if (status === "unauthed") return <Redirect href="/verify" />;
  if (user && !user.onboarded) return <Redirect href="/onboarding" />;
  return <>{children}</>;
}
