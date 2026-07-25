import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
  useAuth,
  useInbox,
  useRespondConnect,
  type Connection,
} from "@/sdk";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingDots } from "@/components/LoadingDots";
import { ShareContactModal } from "@/components/ShareContactModal";
import { theme } from "@/lib/theme";
import { timeAgo } from "@/lib/format";

/**
 * Inbox (Decision 8/9/13.7): all connections, newest activity first.
 * - incoming pending → Approve / Decline
 * - outgoing pending → "Requested"
 * - approved → tap → the other person's contacts (auto-revealed on approve)
 * Refreshes on tab focus — no push notifications in the app.
 */
export default function InboxScreen() {
  const query = useInbox();
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const [selected, setSelected] = useState<Connection | null>(null);

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (query.isLoading) return <LoadingDots fullscreen />;

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        ListEmptyComponent={
          <EmptyState
            title="No connections yet"
            subtitle="Find someone in the feed and tap Connect on their profile."
          />
        }
        contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
        renderItem={({ item }) => <InboxRow connection={item} onOpen={() => setSelected(item)} />}
      />
      <ContactRevealModal connection={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

function InboxRow({ connection: c, onOpen }: { connection: Connection; onOpen: () => void }) {
  const router = useRouter();
  const respond = useRespondConnect();

  const isIncomingPending = c.status === "pending" && c.direction === "incoming";
  const isOutgoingPending = c.status === "pending" && c.direction === "outgoing";
  const isApproved = c.status === "approved";

  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        if (isApproved) onOpen();
        else router.push(`/user/${c.other.handle}`);
      }}
    >
      <Avatar uri={c.other.avatar_url} name={c.other.handle} size={48} />
      <View style={styles.rowBody}>
        <Text style={styles.handle}>@{c.other.handle}</Text>
        <Text style={styles.status}>
          {isIncomingPending
            ? "wants to connect"
            : isOutgoingPending
              ? "request sent"
              : "connected — tap for contacts"}
          {"  ·  "}
          {timeAgo(c.updated_at)}
        </Text>
      </View>
      {isIncomingPending ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.pill, styles.approve]}
            disabled={respond.isPending}
            onPress={() => respond.mutate({ id: c.id, action: "approve" })}
          >
            <Text style={styles.pillText}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.pill, styles.decline]}
            disabled={respond.isPending}
            onPress={() => respond.mutate({ id: c.id, action: "decline" })}
          >
            <Text style={styles.pillText}>Decline</Text>
          </Pressable>
        </View>
      ) : isApproved ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

/** Approved connection detail: the other person's contacts + share-mine prompt. */
function ContactRevealModal({
  connection: c,
  onClose,
}: {
  connection: Connection | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const iHaveContacts = Boolean(user?.instagram || user?.whatsapp);

  if (!c) return null;
  const contacts = c.other_contacts;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
            <Avatar uri={c.other.avatar_url} name={c.other.handle} size={64} />
            <Text style={styles.handle}>@{c.other.handle}</Text>
          </View>

          {contacts?.instagram ? (
            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`https://instagram.com/${contacts.instagram}`)}
            >
              <Ionicons name="logo-instagram" size={20} color={theme.colors.text} />
              <Text style={styles.contactText}>@{contacts.instagram}</Text>
              <Ionicons name="open-outline" size={16} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
          {contacts?.whatsapp ? (
            <View style={styles.contactRow}>
              <Ionicons name="logo-whatsapp" size={20} color={theme.colors.text} />
              <Text style={styles.contactText}>{contacts.whatsapp}</Text>
            </View>
          ) : null}
          {!contacts?.instagram && !contacts?.whatsapp ? (
            <Text style={styles.status}>@{c.other.handle} hasn't added contacts yet.</Text>
          ) : null}

          {!iHaveContacts ? (
            <Pressable style={[styles.pill, styles.approve]} onPress={() => setShareOpen(true)}>
              <Text style={styles.pillText}>Share your contact</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
      <ShareContactModal visible={shareOpen} onClose={() => setShareOpen(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    color: theme.colors.text,
    fontSize: theme.font.xl,
    fontWeight: "800",
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  handle: { color: theme.colors.text, fontSize: theme.font.md, fontWeight: "700" },
  status: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  actions: { flexDirection: "row", gap: theme.spacing.sm },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
  },
  approve: { backgroundColor: theme.colors.accent },
  decline: { backgroundColor: theme.colors.surfaceAlt },
  pillText: { color: theme.colors.text, fontWeight: "700", fontSize: theme.font.sm },
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  contactText: { color: theme.colors.text, fontSize: theme.font.md, fontWeight: "600", flex: 1 },
});
