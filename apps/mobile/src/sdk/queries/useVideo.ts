import { trpc } from "../api/trpc";

/** One video by id (video detail screen). */
export function useVideo(id: string) {
  return trpc.videos.get.useQuery({ id }, { enabled: id.length > 0 });
}

/** Delete own video (detail screen). */
export function useDeleteVideo() {
  const utils = trpc.useUtils();
  return trpc.videos.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.feed.main.invalidate(), utils.feed.user.invalidate()]);
    },
  });
}
