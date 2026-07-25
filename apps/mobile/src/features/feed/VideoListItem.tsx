import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Video } from "@/sdk";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoOverlay } from "@/components/VideoOverlay";

/**
 * One full-screen feed card: autoplay when active, tap to pause, loop.
 *
 * `mounted` gates the actual player: iOS allows only a handful of concurrent
 * video decoders, so the feed keeps live players ONLY for the active card ± 1
 * (TikTok pattern) — every other card renders its poster thumbnail instead.
 */
export function VideoListItem({
  video,
  isActive,
  mounted,
  height,
}: {
  video: Video;
  isActive: boolean;
  mounted: boolean;
  height: number;
}) {
  // Sound is always on for now (mute toggle disabled in VideoOverlay):
  // const muted = useUiStore((s) => s.muted);
  const [manualPause, setManualPause] = useState(false);

  useEffect(() => {
    if (!isActive) setManualPause(false);
  }, [isActive]);

  const paused = !isActive || manualPause;

  return (
    <Pressable
      onPress={() => setManualPause((p) => !p)}
      style={{ height, width: "100%", backgroundColor: "#000" }}
    >
      {mounted ? (
        <VideoPlayer playbackId={video.playback_id} paused={paused} muted={false} />
      ) : (
        <Image
          source={{ uri: video.thumbnail_url ?? undefined }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      )}
      {paused && manualPause ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="play" size={72} color="rgba(255,255,255,0.85)" />
        </View>
      ) : null}
      <VideoOverlay video={video} />
    </Pressable>
  );
}
