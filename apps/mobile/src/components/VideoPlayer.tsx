// NOTE: must come from expo-router — in SDK 57 expo-router is no longer built
// on react-navigation, so @react-navigation/native's useIsFocused finds no
// NavigationContainer and throws.
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

/**
 * Thin wrapper over expo-video (Expo Go compatible — no custom native code).
 *
 * The player lifecycle is managed BY HAND via createVideoPlayer instead of
 * useVideoPlayer: the hook keys the player by source, so a recycled feed card
 * (new playbackId) silently creates a NEW player and release()s the old one
 * WITHOUT pausing. The released native AVPlayer keeps playing until deferred
 * deallocation — ghost audio — and hogs one of iOS's few hardware video
 * decoders, starving the next card's player. Here instead:
 *   • one stable native player per mounted card,
 *   • source swaps via pause() + replaceAsync() on the SAME player,
 *   • deterministic pause() → release() on unmount (in that order).
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

  const playerRef = useRef<ExpoVideoPlayer | null>(null);
  if (playerRef.current == null) {
    playerRef.current = createVideoPlayer(url);
    playerRef.current.loop = repeat;
  }
  const player = playerRef.current;

  // Deterministic teardown: stop sound BEFORE releasing the shared object —
  // release() alone lets the native player play on until GC gets to it.
  useEffect(() => {
    return () => {
      const p = playerRef.current;
      playerRef.current = null;
      try {
        p?.pause();
      } catch {
        /* already released */
      }
      try {
        p?.release();
      } catch {
        /* already released */
      }
    };
  }, []);

  // FeedList recycles items — swap the source on the SAME player.
  const lastUrl = useRef(url);
  useEffect(() => {
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    try {
      if (player.playing) player.pause();
      player.loop = repeat;
    } catch {
      /* released */
    }
    void player.replaceAsync(url);
  }, [player, url, repeat]);

  // Pause whenever this screen loses navigation focus (another screen pushed
  // on top, tab switched) — otherwise audio keeps playing behind it.
  const isFocused = useIsFocused();
  const shouldPlay = !paused && isFocused;

  // Belt-and-suspenders: ALSO pause imperatively on the blur event itself —
  // this fires even if the focus change never re-renders this component.
  useFocusEffect(
    useCallback(() => {
      const p = playerRef.current;
      if (p && shouldPlayRef.current) {
        try {
          p.play();
        } catch {
          /* released */
        }
      }
      return () => {
        if (__DEV__) console.log(`[video ${playbackId}] blur → pause`);
        try {
          playerRef.current?.pause();
        } catch {
          /* released */
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

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
    if (__DEV__) {
      console.log(
        `[video ${playbackId}] ${shouldPlay ? "PLAY" : "PAUSE"} (status=${player.status}, playing=${String(player.playing)})`,
      );
    }
    if (!shouldPlay) {
      // Never touch a player that isn't actually playing — pause() on a
      // still-loading source wedges expo-video's command queue.
      if (player.playing) player.pause();
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
