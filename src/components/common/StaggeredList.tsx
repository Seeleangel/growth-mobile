/**
 * StaggeredList Component
 *
 * Provides a staggered fade-in animation for list items.
 * Each item animates in with a slight delay after the previous one,
 * creating a cascading entrance effect.
 *
 * Child-friendly design:
 * - Smooth fade and slide animation
 * - Configurable delay between items
 * - Respects reduce motion preference
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { TIMING, EASING, shouldAnimate } from '../index';

export interface StaggeredListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  staggerDelay?: number; // Delay between each item in ms (default: 80)
  containerStyle?: ViewStyle;
  itemDelay?: number; // Initial delay before first item (default: 0)
}

interface StaggeredItemProps {
  children: React.ReactNode;
  delay: number;
  index: number;
}

/**
 * Individual staggered item component
 * Handles the entrance animation for a single item
 */
const StaggeredItem: React.FC<StaggeredItemProps> = ({ children, delay }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;

      shouldAnimate().then(canAnimate => {
        if (canAnimate) {
          opacity.value = withDelay(
            delay,
            withTiming(1, {
              duration: TIMING.normal * 0.6,
              easing: EASING.smooth,
            })
          );
          translateY.value = withDelay(
            delay,
            withTiming(0, {
              duration: TIMING.normal,
              easing: EASING.smooth,
            })
          );
        } else {
          opacity.value = 1;
          translateY.value = 0;
        }
      });
    }
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

/**
 * StaggeredList Component
 *
 * Wraps a list of items and provides staggered entrance animations
 *
 * @example
 * ```tsx
 * <StaggeredList
 *   data={items}
 *   keyExtractor={(item) => item.id}
 *   renderItem={(item, index) => (
 *     <Card key={index}>{item.name}</Card>
 *   )}
 *   staggerDelay={100}
 * />
 * ```
 */
export const StaggeredList = <T,>({
  data,
  renderItem,
  keyExtractor,
  staggerDelay = 80,
  containerStyle,
  itemDelay = 0,
}: StaggeredListProps<T>) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const delay = itemDelay + index * staggerDelay;

        return (
          <StaggeredItem key={key} delay={delay} index={index}>
            {renderItem(item, index)}
          </StaggeredItem>
        );
      })}
    </View>
  );
};

/**
 * StaggeredGrid Component
 *
 * Similar to StaggeredList but for grid layouts
 */
export interface StaggeredGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  numColumns: number;
  staggerDelay?: number;
  containerStyle?: ViewStyle;
  itemDelay?: number;
  columnGap?: number;
  rowGap?: number;
}

export const StaggeredGrid = <T,>({
  data,
  renderItem,
  keyExtractor,
  numColumns,
  staggerDelay = 80,
  containerStyle,
  itemDelay = 0,
  columnGap = 12,
  rowGap = 12,
}: StaggeredGridProps<T>) => {
  // Calculate rows for staggered animation
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < data.length; i += numColumns) {
    rows.push(data.slice(i, i + numColumns));
  }

  return (
    <View style={[styles.gridContainer, containerStyle]}>
      {rows.map((rowData, rowIndex) => {
        const rowDelay = itemDelay + rowIndex * staggerDelay;

        return (
          <View
            key={`row-${rowIndex}`}
            style={[
              styles.row,
              { marginBottom: rowGap },
            ]}
          >
            {rowData.map((item, colIndex) => {
              const index = rowIndex * numColumns + colIndex;
              const key = keyExtractor(item, index);
              const colDelay = rowDelay + colIndex * (staggerDelay / 2);

              return (
                <StaggeredItem key={key} delay={colDelay} index={index}>
                  <View style={[{ flex: 1 }, colIndex < numColumns - 1 && { marginRight: columnGap }]}>
                    {renderItem(item, index)}
                  </View>
                </StaggeredItem>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
