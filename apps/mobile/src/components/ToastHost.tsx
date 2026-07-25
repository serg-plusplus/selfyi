import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUiStore } from "@/sdk";
import { theme } from "@/lib/theme";

const AUTO_HIDE_MS = 4000;

/** Single global toast ("Published" etc.). Tap → optional deep link. */
export function ToastHost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hideToast, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <Pressable
      style={[styles.toast, { top: insets.top + theme.spacing.sm }]}
      onPress={() => {
        hideToast();
        if (toast.href) router.push(toast.href as never);
      }}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    zIndex: 100,
  },
  text: { color: theme.colors.text, fontSize: theme.font.md, fontWeight: "600", textAlign: "center" },
});
