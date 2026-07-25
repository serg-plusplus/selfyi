import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { Video } from "@/sdk";
import { theme } from "@/lib/theme";
import { UserHandle } from "./UserHandle";

/**
 * Feed video overlay (Decision 13.3): @username pill bottom-left — tap →
 * public profile (the "+" hints at adding the person). No likes/comments/
 */
export function VideoOverlay({ video }: { video: Video }) {
  const router = useRouter();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.handle} pointerEvents="box-none">
        <Pressable
          style={styles.handlePill}
          onPress={() => router.push(`/user/${video.author.handle}`)}
          hitSlop={8}
        >
          <UserHandle
            handle={video.author.handle}
            tappable={false}
            style={{ fontSize: theme.font.lg + 2 }}
          />
          <Ionicons name="add" size={20} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>
      {/* Mute toggle — intentionally disabled for now: feed always plays with
          sound. Re-enable by uncommenting (state lives in uiStore).
      <Pressable style={styles.mute} onPress={toggleMuted} hitSlop={12}>
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={22}
          color={theme.colors.text}
        />
      </Pressable>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    left: theme.spacing.md,
    bottom: 128,
    right: 96,
    flexDirection: "row",
  },
  handlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  // kept for the commented-out mute toggle above
  mute: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 160,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.radius.full,
    padding: theme.spacing.sm,
  },
});
