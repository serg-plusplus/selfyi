import { trpc } from "../api/trpc";

export function useInbox() {
  return trpc.connections.inbox.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
}

export function useSendConnect() {
  const utils = trpc.useUtils();
  return trpc.connections.send.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.connections.inbox.invalidate(),
        utils.users.getByHandle.invalidate(),
        utils.users.getById.invalidate(),
      ]);
    },
  });
}

export function useRespondConnect() {
  const utils = trpc.useUtils();
  return trpc.connections.respond.useMutation({
    onSuccess: async () => {
      await utils.connections.inbox.invalidate();
    },
  });
}
