import { useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [player, setPlayer] = useState<ExpoVideoPlayer | null>(null);
  const playerRef = useRef<ExpoVideoPlayer | null>(null);

  const isFocused = useIsFocused();
  const shouldPlay = !paused && isFocused;
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  useEffect(() => {
    const instance = createVideoPlayer(null);
    instance.loop = repeat;
    instance.muted = muted;
    playerRef.current = instance;
    setPlayer(instance);

    const subscription = instance.addListener("statusChange", ({ status, error }) => {
      if (__DEV__ && error) console.warn(`[video ${playbackId}] ${error.message}`);
      if (status === "readyToPlay" && shouldPlayRef.current) instance.play();
    });

    return () => {
      playerRef.current = null;
      subscription.remove();
      try {
        instance.pause();
      } catch {
      }
      try {
        instance.release();
      } catch {
      }
    };
  }, []);

  useEffect(() => {
    if (!player) return;
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

  useEffect(() => {
    if (player) player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (!player) return;
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
          playerRef.current?.pause();
        } catch {
        }
      };
    }, []),
  );

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      {player ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit={resizeMode}
          nativeControls={false}
        />
      ) : null}
    </View>
  );
}
