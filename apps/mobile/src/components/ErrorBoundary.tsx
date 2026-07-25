import { Component, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { theme } from "@/lib/theme";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Global error boundary (mobile spec §5.2). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Uncaught error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.font.lg, fontWeight: "700" }}>Something went wrong</Text>
          <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>{this.state.error.message}</Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: theme.colors.accent, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.full }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
