import { LegendList } from "@legendapp/list";
import type { ReactElement } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

interface ViewableInfo<T> {
  viewableItems: { item: T; index: number | null; isViewable: boolean }[];
}

interface FeedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactElement | null;
  keyExtractor: (item: T) => string;
  /** full item height — one item per swipe (TikTok pager, Decision 13). */
  itemHeight: number;
  onEndReached?: () => void;
  onViewableItemsChanged?: (info: ViewableInfo<T>) => void;
  viewabilityConfig?: { itemVisiblePercentThreshold?: number };
  /** Raw scroll passthrough — the feed derives the active page from offset. */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Virtualized vertical pager built on @legendapp/list. One full-screen video
 * per swipe, snap paging, no pull-to-refresh (Decision 13).
 */
export function FeedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  onEndReached,
  onViewableItemsChanged,
  viewabilityConfig,
  onScroll,
}: FeedListProps<T>) {
  return (
    <LegendList
      data={data}
      renderItem={({ item, index }) => renderItem(item as T, index)}
      keyExtractor={(item) => keyExtractor(item as T)}
      estimatedItemSize={itemHeight}
      recycleItems
      pagingEnabled
      snapToInterval={itemHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged as never}
      viewabilityConfig={viewabilityConfig}
      onScroll={onScroll}
    />
  );
}
