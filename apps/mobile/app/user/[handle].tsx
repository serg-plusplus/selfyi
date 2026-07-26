import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useAuth, useProfileByHandle, useSendConnect, useUserFeed, type Video } from "@/sdk";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingDots } from "@/components/LoadingDots";
import { theme } from "@/lib/theme";

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuth().user;
  const userQuery = useProfileByHandle(handle ?? "");
  const user = userQuery.data;
  const feedQuery = useUserFeed(user?.id ?? "");
  const videos = feedQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const sendConnect = useSendConnect();
  const { width } = useWindowDimensions();
  const cell = width / 3;

  if (!user) return <LoadingDots fullscreen />;

  const isSelf = me?.id === user.id;
  const c = user.connection;

  const connectLabel = !c
    ? "Connect"
    : c.status === "approved"
      ? "Connected ✓"
      : c.direction === "outgoing"
        ? "Requested"
        : "Respond in Inbox";

  const onConnectPress = () => {
    if (!c) {
      sendConnect.mutate({ userId: user.id });
    } else if (c.status === "pending" && c.direction === "incoming") {
      router.push("/(tabs)/inbox");
    } else if (c.status === "approved") {
      router.push("/(tabs)/inbox");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack.Screen options={{ title: `@${user.handle}` }} />
      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={(v) => v.id}
        onEndReached={() => feedQuery.hasNextPage && feedQuery.fetchNextPage()}
        ListHeaderComponent={
          <View style={{ alignItems: "center", padding: theme.spacing.lg, gap: theme.spacing.sm }}>
            <Avatar uri={user.avatar_url} name={user.handle} size={88} />
            <Text style={{ color: theme.colors.text, fontSize: theme.font.xl, fontWeight: "800" }}>
              @{user.handle}
            </Text>
            {!isSelf ? (
              <Pressable
                onPress={onConnectPress}
                disabled={sendConnect.isPending || (c?.status === "pending" && c.direction === "outgoing")}
                style={{
                  marginTop: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.full,
                  backgroundColor: !c ? theme.colors.accent : theme.colors.surfaceAlt,
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                  {sendConnect.isPending ? "Sending…" : connectLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyState title="No posts yet" />}
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
          </Pressable>
        )}
      />
    </View>
  );
}
