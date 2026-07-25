import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUserFeed, type Video } from "@/sdk";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { ShareContactModal } from "@/components/ShareContactModal";
import { theme } from "@/lib/theme";

/** Own profile: avatar, @handle, contacts (view/edit), logout, video grid. */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const query = useUserFeed(user?.id ?? "");
  const videos = query.data?.pages.flatMap((p) => p.items) ?? [];
  const { width } = useWindowDimensions();
  const cell = width / 3;
  const [editContacts, setEditContacts] = useState(false);

  if (!user) return null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={(v) => v.id}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        ListHeaderComponent={
          <View style={{ alignItems: "center", padding: theme.spacing.lg, gap: theme.spacing.sm }}>
            {/* Logout: vertically centered on the avatar row, safely offset to
                the right so it can't be fat-fingered from the avatar. */}
            <Pressable
              onPress={logout}
              hitSlop={10}
              style={{
                position: "absolute",
                top: theme.spacing.lg + 44 - 21, // avatar center (lg pad + 88/2) minus half button
                right: theme.spacing.lg,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.full,
                padding: theme.spacing.sm + 1,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.text} />
            </Pressable>
            <Avatar uri={user.avatar_url} name={user.handle} size={88} />
            <Text style={{ color: theme.colors.text, fontSize: theme.font.xl, fontWeight: "800" }}>
              @{user.handle}
            </Text>
            <Pressable
              onPress={() => setEditContacts(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs + 2,
              }}
            >
              <Ionicons name="share-social-outline" size={16} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.sm }}>
                {user.instagram || user.whatsapp
                  ? [user.instagram && `ig: ${user.instagram}`, user.whatsapp && `wa: ${user.whatsapp}`]
                      .filter(Boolean)
                      .join("  ·  ")
                  : "Add your contacts"}
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No posts yet" subtitle="Tap the camera button to record your first video." />
        }
        renderItem={({ item }: { item: Video }) => (
          <Pressable
            onPress={() => router.push(`/video/${item.id}`)}
            style={{ width: cell, height: cell * 1.4, padding: 1 }}
          >
            <Image
              source={{ uri: item.thumbnail_url ?? undefined }}
              style={{ flex: 1, backgroundColor: theme.colors.surfaceAlt }}
              contentFit="cover"
            />
            {item.status === "processing" ? (
              <View
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  backgroundColor: theme.colors.overlay,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: theme.radius.sm,
                }}
              >
                <Text style={{ color: theme.colors.text, fontSize: 10 }}>Processing</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <ShareContactModal visible={editContacts} onClose={() => setEditContacts(false)} />
    </SafeAreaView>
  );
}
