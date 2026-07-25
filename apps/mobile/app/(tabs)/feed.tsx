import { useState } from "react";
import {
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
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
  // IMPORTANT: derive the initial active item synchronously. With a `null`
  // first render every card was paused → pause() hit still-loading players
  // and wedged them (the feed froze while the single-video screen played).
  const [activeIdState, setActiveId] = useState<string | null>(null);
  const activeId = activeIdState ?? videos[0]?.id ?? null;

  // Active page from raw scroll offset — @legendapp/list v1 viewability
  // callbacks are unreliable (stabilized only in v2), scroll events always fire.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / height);
    const v = videos[Math.max(0, Math.min(videos.length - 1, idx))];
    if (v && v.id !== activeId) {
      if (__DEV__) console.log(`[feed] active → #${idx} (${v.id})`);
      setActiveId(v.id);
    }
  };

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
        onScroll={onScroll}
      />
    </View>
  );
}
