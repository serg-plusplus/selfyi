import { useFocusEffect, useIsFocused } from "expo-router";
import { useEventListener } from "expo";
import { useCallback, useEffect, useRef } from "react";
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

export function VideoPlayer({
  playbackId,
  paused = false,
  muted = false,
  repeat = true,
  resizeMode = "cover",
  style,
}: VideoPlayerProps) {
  const url = hlsUrlFor(playbackId);

  const player = useVideoPlayer(null, (p) => {
    p.loop = repeat;
    p.muted = muted;
  });

  const isFocused = useIsFocused();
  const shouldPlay = !paused && isFocused;
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  useEffect(() => {
    let cancelled = false;
    player
      .replaceAsync(url)
      .then(() => {
        if (!cancelled && shouldPlayRef.current) player.play();
      })
      .catch((e: unknown) => {
        if (__DEV__) console.warn(`[video ${playbackId}] load failed`, e);
      });
    return () => {
      cancelled = true;
    };
  }, [player, url, playbackId]);

  useEventListener(player, "statusChange", ({ status, error }) => {
    if (__DEV__ && error) console.warn(`[video ${playbackId}] ${error.message}`);
    if (status === "readyToPlay" && shouldPlayRef.current) player.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (__DEV__) {
      console.log(
        `[video ${playbackId}] ${shouldPlay ? "PLAY" : "PAUSE"} status=${player.status} playing=${String(player.playing)}`,
      );
    }
    if (!shouldPlay) {
      if (player.playing) player.pause();
      return;
    }
    if (player.status === "readyToPlay" && player.currentTime > 0) player.currentTime = 0;
    player.play();
  }, [player, shouldPlay, playbackId]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {
          /* released */
        }
      };
    }, [player]),
  );

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
