import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { Video } from "@/sdk";
import { theme } from "@/lib/theme";
import { UserHandle } from "./UserHandle";

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
  mute: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 160,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.radius.full,
    padding: theme.spacing.sm,
  },
});
