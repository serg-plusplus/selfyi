import { useEffect, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useFeed, type Video } from "@/sdk";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "@/components/FeedList";
import { LoadingDots } from "@/components/LoadingDots";
import { VideoListItem } from "@/features/feed/VideoListItem";

/** TikTok-style pager: all videos, newest → oldest, swipe up/down. */
export default function FeedScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useFeed();
  const videos = data?.pages.flatMap((p) => p.items) ?? [];
  const { height } = useWindowDimensions();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && videos[0]) setActiveId(videos[0].id);
  }, [videos, activeId]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: Video; isViewable: boolean }[] }) => {
      const first = viewableItems.find((v) => v.isViewable);
      if (first) setActiveId(first.item.id);
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  if (isLoading) return <LoadingDots fullscreen />;
  if (videos.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <EmptyState title="No videos yet" subtitle="Tap the camera button to post the first one." />
      </View>
    );
  }

  const activeIndex = Math.max(
    0,
    videos.findIndex((v) => v.id === activeId),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FeedList
        data={videos}
        itemHeight={height}
        keyExtractor={(v) => v.id}
        renderItem={(v, i) => (
          <VideoListItem
            video={v}
            isActive={v.id === activeId}
            // live player only around the viewport — iOS decoder limit
            mounted={Math.abs(i - activeIndex) <= 1}
            height={height}
          />
        )}
        onEndReached={() => {
          if (hasNextPage) void fetchNextPage();
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}
