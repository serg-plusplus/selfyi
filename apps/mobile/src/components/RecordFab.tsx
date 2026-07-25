import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_VIDEO_DURATION_SEC } from "@selfie/common";
import { useUiStore, useUploadVideo } from "@/sdk";
import { theme } from "@/lib/theme";

/**
 * The always-visible camera FAB (Decision 6 + 13.2): opens the NATIVE iOS
 * camera (max 30s, enforced by the system UI), uploads the result to Stream.
 * While uploading the FAB turns into a spinner; on failure → alert; on
 * success → "Published" toast that deep-links to the own profile.
 */
export function RecordFab() {
  const insets = useSafeAreaInsets();
  const fabState = useUiStore((s) => s.fabState);
  const showToast = useUiStore((s) => s.showToast);
  const { upload } = useUploadVideo();

  const record = async () => {
    if (fabState === "uploading") return;

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access in Settings to record.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
      cameraType: ImagePicker.CameraType.front,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    try {
      await upload(asset.uri);
      showToast({ message: "Published! Tap to view your profile.", href: "/(tabs)/profile" });
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <Pressable
      onPress={record}
      style={[styles.fab, { bottom: insets.bottom + 72 }]}
      disabled={fabState === "uploading"}
    >
      {fabState === "uploading" ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Ionicons name="videocam" size={28} color="#fff" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: theme.spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
