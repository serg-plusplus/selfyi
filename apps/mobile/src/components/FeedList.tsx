import type { ReactElement } from "react";
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

interface FeedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactElement | null;
  keyExtractor: (item: T) => string;
  itemHeight: number;
  onEndReached?: () => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function FeedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  onEndReached,
  onScroll,
}: FeedListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={keyExtractor}
      pagingEnabled
      snapToInterval={itemHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
      scrollEventThrottle={16}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      windowSize={3}
      removeClippedSubviews={false}
    />
  );
}
