import { useCallback } from "react";
import { trpc } from "../api/trpc";
import { useUiStore } from "../store/uiStore";
import { uploadToStream } from "./streamUploader";

export function useUploadVideo() {
  const utils = trpc.useUtils();
  const getUploadUrl = trpc.videos.getUploadUrl.useMutation();
  const setFabState = useUiStore((s) => s.setFabState);

  const upload = useCallback(
    async (fileUri: string): Promise<{ videoId: string }> => {
      setFabState("uploading");
      try {
        const { uploadURL, videoId } = await getUploadUrl.mutateAsync();
        await uploadToStream({ uploadUrl: uploadURL, fileUri });
        await utils.feed.user.invalidate();
        return { videoId };
      } finally {
        setFabState("idle");
      }
    },
    [getUploadUrl, utils, setFabState],
  );

  return { upload };
}
