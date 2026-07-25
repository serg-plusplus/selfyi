import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as Linking from "expo-linking";
import type { Me, WorldIdSessionStatus } from "@selfie/common";
import { config } from "../config";
import { queryClient } from "../api/TRPCProvider";
import { trpc } from "../api/trpc";
import { tokenStorage } from "./tokenStorage";

type AuthStatus = "loading" | "authed" | "unauthed";
/** SPEC §5.4 UI states ('confirmed'/'failed' resolve into authed / thrown error). */
export type GateState = "idle" | "opening" | "awaiting";

const POLL_INTERVAL_MS = 2_000;
const POLL_SLICE_MS = 200;
/** SPEC §5.3 — client-side timeout 5 minutes. */
const GATE_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function friendlyGateError(code: string | null): string {
  switch (code) {
    case "user_rejected":
    case "verification_rejected":
      return "Verification was cancelled in World App.";
    case "timeout":
      return "Verification timed out. Please try again.";
    case "session_lost":
      return "The session expired. Please try again.";
    case "max_verifications_reached":
      return "This World ID was already used the maximum number of times.";
    default:
      return `Verification failed${code ? ` (${code})` : ""}. Please try again.`;
  }
}

interface AuthContextValue {
  user: Me | null;
  status: AuthStatus;
  /** World ID gate progress for the verify screen (SPEC §5.4). */
  gateState: GateState;
  /** Run the World ID gate: create session → World App → poll → JWT. */
  verifyWithWorldId: () => Promise<void>;
  /** Onboarding: claim a @handle (first login only). */
  completeOnboarding: (handle: string) => Promise<void>;
  /** Update own contacts (Share contact popup / profile edit). */
  updateContacts: (contacts: { instagram?: string; whatsapp?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const createSession = trpc.worldid.createSession.useMutation();
  const onboardingMutation = trpc.auth.completeOnboarding.useMutation();
  const contactsMutation = trpc.auth.updateContacts.useMutation();
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [gateState, setGateState] = useState<GateState>("idle");

  const bootstrap = useCallback(async () => {
    const token = await tokenStorage.getToken();
    if (!token) {
      setStatus("unauthed");
      return;
    }
    try {
      const me = await utils.auth.me.fetch();
      setUser(me);
      setStatus("authed");
    } catch {
      await tokenStorage.clearToken();
      setUser(null);
      setStatus("unauthed");
    }
  }, [utils]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  /**
   * SPEC §5.3 — poll `worldid.getSession` every 2s until confirmed/failed.
   * A deep-link return from World App pokes an immediate poll (but we never
   * rely on it alone — the user may switch back manually). Network errors
   * don't change state; the next tick retries (SPEC §7).
   */
  const pollSession = useCallback(
    async (sessionId: string): Promise<WorldIdSessionStatus> => {
      let poke = false;
      const sub = Linking.addEventListener("url", () => {
        poke = true;
      });
      try {
        const startedAt = Date.now();
        while (Date.now() - startedAt < GATE_TIMEOUT_MS) {
          try {
            const s = await utils.worldid.getSession.fetch(
              { sessionId },
              { staleTime: 0, gcTime: 0 },
            );
            if (s.state !== "pending") return s;
          } catch {
            // transient network failure — retry on the next tick
          }
          // sleep in slices so a deep-link poke shortens the wait
          for (let waited = 0; waited < POLL_INTERVAL_MS && !poke; waited += POLL_SLICE_MS) {
            await sleep(POLL_SLICE_MS);
          }
          poke = false;
        }
        return { state: "failed", error: "timeout", token: null, user: null };
      } finally {
        sub.remove();
      }
    },
    [utils],
  );

  const verifyWithWorldId = useCallback(async () => {
    setGateState("opening");
    try {
      const { sessionId, connectorURI } = await createSession.mutateAsync(
        config.worldMock
          ? { mockNullifier: await tokenStorage.getMockNullifier() }
          : { returnTo: Linking.createURL("verify") },
      );

      if (connectorURI) {
        setGateState("awaiting");
        await Linking.openURL(connectorURI);
      }

      const result = await pollSession(sessionId);
      if (result.state === "confirmed" && result.token && result.user) {
        await tokenStorage.setToken(result.token);
        setUser(result.user);
        setStatus("authed");
        return;
      }
      throw new Error(friendlyGateError(result.error));
    } finally {
      setGateState("idle");
    }
  }, [createSession, pollSession]);

  const completeOnboarding = useCallback(
    async (handle: string) => {
      const me = await onboardingMutation.mutateAsync({ handle });
      setUser(me);
    },
    [onboardingMutation],
  );

  const updateContacts = useCallback(
    async (contacts: { instagram?: string; whatsapp?: string }) => {
      const me = await contactsMutation.mutateAsync(contacts);
      setUser(me);
      await utils.connections.inbox.invalidate();
    },
    [contactsMutation, utils],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clearToken();
    setUser(null);
    setStatus("unauthed");
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        gateState,
        verifyWithWorldId,
        completeOnboarding,
        updateContacts,
        logout,
        refresh: bootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
