import { trpc } from "../api/trpc";

/** Public profile by @handle, incl. viewer-relative connection state. */
export function useProfileByHandle(handle: string) {
  return trpc.users.getByHandle.useQuery({ handle }, { enabled: handle.length > 0 });
}
