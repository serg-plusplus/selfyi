import { trpc } from "../api/trpc";

export function useFeed() {
  return trpc.feed.main.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
}

export function useUserFeed(userId: string) {
  return trpc.feed.user.useInfiniteQuery(
    { userId, limit: 24 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined, enabled: userId.length > 0 },
  );
}
