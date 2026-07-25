import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import { config } from "../config";
import { tokenStorage } from "../auth/tokenStorage";
import { trpc } from "./trpc";

/** Shared across the app so we can clear it on logout (mobile spec §4.6). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2, refetchOnWindowFocus: false },
  },
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${config.apiBaseUrl}/trpc`,
          // Read the JWT fresh from SecureStore per request — no auth state in
          // React, so this can't go stale.
          async headers() {
            const token = await tokenStorage.getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
