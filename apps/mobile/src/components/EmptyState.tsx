import { Text, View } from "react-native";
import { theme } from "@/lib/theme";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl, gap: theme.spacing.sm }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.font.lg, fontWeight: "600", textAlign: "center" }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.md, textAlign: "center" }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
