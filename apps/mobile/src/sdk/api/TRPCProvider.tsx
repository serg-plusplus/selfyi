import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import { config } from "../config";
import { tokenStorage } from "../auth/tokenStorage";
import { trpc } from "./trpc";

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
