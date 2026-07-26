import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@selfie/backend";

export const trpc = createTRPCReact<AppRouter>();
