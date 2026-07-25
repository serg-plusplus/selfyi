import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { hlsUrlFor } from "@/sdk";

interface VideoPlayerProps {
  playbackId: string;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  resizeMode?: "cover" | "contain";
  style?: ViewStyle;
}

/**
 * Thin wrapper over expo-video (Expo Go compatible — no custom native code).
 * Builds the Stream HLS URL from the playback id; play/pause via the `paused`
 * prop so the player stays a one-file swap.
 */
export function VideoPlayer({
  playbackId,
  paused = false,
  muted = false,
  repeat = true,
  resizeMode = "cover",
  style,
}: VideoPlayerProps) {
  const player = useVideoPlayer(hlsUrlFor(playbackId), (p) => {
    p.loop = repeat;
  });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (paused) {
      player.pause();
    } else {
      // restart from the top when (re)activated, like a feed should
      player.currentTime = 0;
      player.play();
    }
  }, [player, paused]);

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={resizeMode}
        nativeControls={false}
      />
    </View>
  );
}
