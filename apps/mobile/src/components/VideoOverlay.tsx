import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Video } from "@/sdk";
import { theme } from "@/lib/theme";
import { UserHandle } from "./UserHandle";

const CONNECT_SIZE = 42;

export function VideoOverlay({ video }: { video: Video }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={[styles.row, { bottom: insets.bottom + theme.fab.bottomOffset }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.target}
          onPress={() => router.push(`/user/${video.author.handle}`)}
          hitSlop={8}
        >
          <View style={styles.pill}>
            <UserHandle
              handle={video.author.handle}
              tappable={false}
              style={{ fontSize: theme.font.lg + 2 }}
            />
          </View>
          <Animated.View style={[styles.connect, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="person-add" size={20} color="#fff" />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: theme.spacing.md,
    right: 96,
    height: theme.fab.size,
    flexDirection: "row",
    alignItems: "center",
  },
  target: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: theme.spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  connect: {
    width: CONNECT_SIZE,
    height: CONNECT_SIZE,
    borderRadius: CONNECT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
});
