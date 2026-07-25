import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore, type Video } from "@/sdk";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoOverlay } from "@/components/VideoOverlay";

/** One full-screen feed card: autoplay when active, tap to pause, loop. */
export function VideoListItem({
  video,
  isActive,
  height,
}: {
  video: Video;
  isActive: boolean;
  height: number;
}) {
  const muted = useUiStore((s) => s.muted);
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
      <VideoPlayer playbackId={video.playback_id} paused={paused} muted={muted} />
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
