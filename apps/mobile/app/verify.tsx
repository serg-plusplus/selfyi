import { Redirect } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, useAuth } from "@/sdk";
import { theme } from "@/lib/theme";

export default function VerifyScreen() {
  const { status, user, gateState, verifyWithWorldId } = useAuth();

  if (status === "authed" && user) {
    return <Redirect href={user.onboarded ? "/(tabs)/feed" : "/onboarding"} />;
  }

  const busy = gateState !== "idle";

  const verify = async () => {
    try {
      await verifyWithWorldId();
    } catch (e) {
      Alert.alert("Verification failed", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Selfie</Text>
        <Text style={styles.tagline}>Real people. Real videos.</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.explainer}>
          {gateState === "awaiting"
            ? "Finish the Selfie Check in World App, then come back here."
            : "Selfie is humans-only. Verify once with World ID — a quick selfie check in the World App. No name, no email, no phone number."}
        </Text>
        <Pressable style={styles.button} onPress={verify} disabled={busy}>
          {busy ? (
            <View style={styles.buttonBusy}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>
                {gateState === "opening" ? "Starting…" : "Waiting for World App…"}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              {config.worldMock ? "Continue (dev mock)" : "Verify with World ID"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.sm },
  logo: { color: theme.colors.text, fontSize: 48, fontWeight: "900" },
  tagline: { color: theme.colors.textMuted, fontSize: theme.font.lg },
  footer: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  explainer: { color: theme.colors.textMuted, fontSize: theme.font.sm, textAlign: "center" },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  buttonBusy: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  buttonText: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
});
