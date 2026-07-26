import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSchema } from "@selfie/common";
import { useAuth } from "@/sdk";
import { theme } from "@/lib/theme";

export default function OnboardingScreen() {
  const router = useRouter();
  const { status, user, completeOnboarding } = useAuth();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "unauthed") return <Redirect href="/verify" />;
  if (user?.onboarded) return <Redirect href="/(tabs)/feed" />;

  const submit = async () => {
    const cleaned = handle.trim().replace(/^@/, "").toLowerCase();
    const parsed = handleSchema.safeParse(cleaned);
    if (!parsed.success) {
      Alert.alert("Invalid username", "2–30 characters: letters, digits, underscore.");
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding(parsed.data);
      router.replace("/(tabs)/feed");
    } catch (e) {
      const message =
        e instanceof Error && e.message.includes("taken")
          ? "That username is taken - try another."
          : "Could not save. Try again.";
      Alert.alert("Oops", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        <Text style={styles.title}>Pick your @username</Text>
        <Text style={styles.subtitle}>This is how people see you in the feed.</Text>
        <TextInput
          style={styles.input}
          placeholder="@username"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          value={handle}
          onChangeText={setHandle}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <Pressable style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1, justifyContent: "center", padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: theme.font.xl, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.md },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: theme.font.lg,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
});
