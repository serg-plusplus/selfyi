import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/sdk";
import { theme } from "@/lib/theme";

interface ShareContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ShareContactModal({ visible, onClose }: ShareContactModalProps) {
  const { user, updateContacts } = useAuth();
  const [instagram, setInstagram] = useState(user?.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const ig = instagram.trim().replace(/^@/, "");
    const wa = whatsapp.trim().replace(/^@/, "");
    if (!ig && !wa) {
      Alert.alert("Add at least one contact");
      return;
    }
    setSaving(true);
    try {
      await updateContacts({
        ...(ig ? { instagram: ig } : {}),
        ...(wa ? { whatsapp: wa } : {}),
      });
      onClose();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Share contact</Text>
          <Text style={styles.subtitle}>
            Entered once - visible to everyone you're connected with.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Instagram username"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={instagram}
            onChangeText={setInstagram}
          />
          <TextInput
            style={styles.input}
            placeholder="WhatsApp username / number"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={whatsapp}
            onChangeText={setWhatsapp}
          />
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={saving}>
              <Text style={styles.btnPrimaryText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: { color: theme.colors.text, fontSize: theme.font.xl, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: theme.font.md,
  },
  row: { flexDirection: "row", gap: theme.spacing.md, justifyContent: "flex-end" },
  btn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  btnGhost: { backgroundColor: theme.colors.surfaceAlt },
  btnGhostText: { color: theme.colors.textMuted, fontWeight: "600" },
  btnPrimary: { backgroundColor: theme.colors.accent },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
