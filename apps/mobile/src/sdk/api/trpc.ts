import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@selfie/backend";

/**
 * The typed tRPC React hooks. `AppRouter` is imported (type-only) from the
 * backend package, giving the client end-to-end type safety with zero codegen.
 */
export const trpc = createTRPCReact<AppRouter>();
