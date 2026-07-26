import { trpc } from "../api/trpc";

export function useProfileByHandle(handle: string) {
  return trpc.users.getByHandle.useQuery({ handle }, { enabled: handle.length > 0 });
}
