import { useIsFocused } from "@react-navigation/native";
import { useEventListener } from "expo";
import { useEffect, useRef } from "react";
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
  const url = hlsUrlFor(playbackId);
  const player = useVideoPlayer(url, (p) => {
    p.loop = repeat;
  });

  // FeedList recycles items (recycleItems) but useVideoPlayer ignores source
  // changes after creation — swap the source explicitly on playbackId change.
  const lastUrl = useRef(url);
  useEffect(() => {
    if (lastUrl.current !== url) {
      lastUrl.current = url;
      void player.replaceAsync(url);
    }
  }, [player, url]);

  // Pause whenever this screen loses navigation focus (another screen pushed
  // on top, tab switched) — otherwise audio keeps playing behind it.
  const isFocused = useIsFocused();
  const shouldPlay = !paused && isFocused;

  // A play() issued while the HLS source is still "loading" can get dropped —
  // re-issue it the moment the stream becomes ready. Also surface player
  // errors in the Metro console instead of failing silently.
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;
  useEventListener(player, "statusChange", ({ status, error }) => {
    if (error) console.warn(`[video ${playbackId}] player error:`, error.message);
    if (status === "readyToPlay" && shouldPlayRef.current) player.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (!shouldPlay) {
      player.pause();
      return;
    }
    // Restart from the top when RE-activated — but never seek while the HLS
    // source is still loading: seeking a not-yet-ready stream wedges AVPlayer
    // at the first frame on iOS (expo/expo#34406).
    if (player.status === "readyToPlay" && player.currentTime > 0) {
      player.currentTime = 0;
    }
    player.play();
  }, [player, shouldPlay]);

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
