import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Video } from "@/sdk";
import { theme } from "@/lib/theme";
import { UserHandle } from "./UserHandle";

export function VideoOverlay({ video }: { video: Video }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={[styles.handle, { bottom: insets.bottom + theme.fab.bottomOffset }]}
        pointerEvents="box-none"
      >
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
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    left: theme.spacing.md,
    right: 96,
    height: theme.fab.size,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  plus: {
    color: "rgba(255,255,255,0.95)",
    fontSize: theme.font.lg + 6,
    fontWeight: "800",
    lineHeight: theme.font.lg + 8,
    marginTop: -1,
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
