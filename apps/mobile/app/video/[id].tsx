import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth, useDeleteVideo, useVideo } from "@/sdk";
import { LoadingDots } from "@/components/LoadingDots";
import { UserHandle } from "@/components/UserHandle";
import { VideoPlayer } from "@/components/VideoPlayer";
import { theme } from "@/lib/theme";

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const me = useAuth().user;
  const { data: video, isLoading } = useVideo(id ?? "");
  const deleteVideo = useDeleteVideo();
  const [paused, setPaused] = useState(false);

  if (isLoading || !video) return <LoadingDots fullscreen />;

  const isOwner = me?.id === video.author.id;

  const confirmDelete = () => {
    Alert.alert("Delete video?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVideo.mutateAsync({ id: video.id });
            router.back();
          } catch {
            Alert.alert("Could not delete", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerRight: isOwner
            ? () => (
                <Pressable onPress={confirmDelete} hitSlop={10}>
                  <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
                </Pressable>
              )
            : undefined,
        }}
      />
      {video.status === "processing" ? (
        <View style={styles.processing}>
          <Text style={styles.processingText}>Processing…</Text>
          <Text style={styles.processingSub}>Your video will appear in the feed shortly.</Text>
        </View>
      ) : (
        <Pressable style={{ flex: 1 }} onPress={() => setPaused((p) => !p)}>
          <VideoPlayer playbackId={video.playback_id} paused={paused} />
          {paused ? (
            <View style={styles.playIcon}>
              <Ionicons name="play" size={72} color="rgba(255,255,255,0.85)" />
            </View>
          ) : null}
        </Pressable>
      )}
      <View style={styles.overlay} pointerEvents="box-none">
        <UserHandle handle={video.author.handle} style={{ fontSize: theme.font.lg }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  overlay: { position: "absolute", left: theme.spacing.md, bottom: theme.spacing.xl },
  playIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  processing: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.sm },
  processingText: { color: theme.colors.text, fontSize: theme.font.xl, fontWeight: "700" },
  processingSub: { color: theme.colors.textMuted, fontSize: theme.font.md },
});
