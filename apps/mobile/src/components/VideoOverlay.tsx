import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useUiStore, type Video } from "@/sdk";
import { theme } from "@/lib/theme";
import { UserHandle } from "./UserHandle";

/**
 * Feed video overlay (Decision 13.3): @username bottom-left (tap → profile),
 * mute toggle bottom-right. That's all — no likes/comments/share in the MVP.
 */
export function VideoOverlay({ video }: { video: Video }) {
  const muted = useUiStore((s) => s.muted);
  const toggleMuted = useUiStore((s) => s.toggleMuted);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.handle} pointerEvents="box-none">
        <UserHandle handle={video.author.handle} style={{ fontSize: theme.font.lg }} />
      </View>
      <Pressable style={styles.mute} onPress={toggleMuted} hitSlop={12}>
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={22}
          color={theme.colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    left: theme.spacing.md,
    bottom: 96,
    right: 96,
  },
  mute: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 160,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.radius.full,
    padding: theme.spacing.sm,
  },
});
