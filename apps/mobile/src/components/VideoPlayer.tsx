import { useFocusEffect, useIsFocused } from "expo-router";
import { useEventListener } from "expo";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { createVideoPlayer, VideoView, type VideoPlayer as ExpoVideoPlayer } from "expo-video";
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

  const playerRef = useRef<ExpoVideoPlayer | null>(null);
  if (playerRef.current == null) {
    playerRef.current = createVideoPlayer(url);
    playerRef.current.loop = repeat;
  }
  const player = playerRef.current;

  useEffect(() => {
    return () => {
      const p = playerRef.current;
      playerRef.current = null;
      try {
        p?.pause();
      } catch {
      }
      try {
        p?.release();
      } catch {
      }
    };
  }, []);

  const lastUrl = useRef(url);
  useEffect(() => {
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    try {
      if (player.playing) player.pause();
      player.loop = repeat;
    } catch {
    }
    void player.replaceAsync(url);
  }, [player, url, repeat]);

  const isFocused = useIsFocused();
  const shouldPlay = !paused && isFocused;

  useFocusEffect(
    useCallback(() => {
      const p = playerRef.current;
      if (p && shouldPlayRef.current) {
        try {
          p.play();
        } catch {
        }
      }
      return () => {
        if (__DEV__) console.log(`[video ${playbackId}] blur → pause`);
        try {
          playerRef.current?.pause();
        } catch {
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

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
    if (__DEV__) {
      console.log(
        `[video ${playbackId}] ${shouldPlay ? "PLAY" : "PAUSE"} (status=${player.status}, playing=${String(player.playing)})`,
      );
    }
    if (!shouldPlay) {
      if (player.playing) player.pause();
      return;
    }
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
