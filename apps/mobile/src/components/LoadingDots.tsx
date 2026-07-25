import { ActivityIndicator, View } from "react-native";
import { theme } from "@/lib/theme";

export function LoadingDots({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.lg,
        ...(fullscreen ? { flex: 1, backgroundColor: theme.colors.bg } : {}),
      }}
    >
      <ActivityIndicator color={theme.colors.textMuted} />
    </View>
  );
}
