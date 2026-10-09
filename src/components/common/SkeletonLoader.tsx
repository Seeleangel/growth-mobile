/**
 * SkeletonLoader — 骨架屏脉冲动画组件
 *
 * 用法:
 *   <SkeletonLoader width={120} height={16} />
 *   <SkeletonLoader width="100%" height={200} borderRadius={20} />
 *   <SkeletonLoader circle size={48} />
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius as br } from '../../utils/theme';

interface SkeletonLoaderProps {
  /** 宽度，支持数字或百分比字符串 */
  width?: number | string;
  /** 高度 */
  height?: number;
  /** 圆角，默认 sm(10) */
  borderRadius?: number;
  /** 圆形模式 — 用于头像 */
  circle?: boolean;
  /** 圆形直径 */
  size?: number;
  /** 额外样式 */
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = br.sm,
  circle = false,
  size = 48,
  style,
}: SkeletonLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const sizeStyle: ViewStyle = circle
    ? { width: size, height: size, borderRadius: size / 2 }
    : { width: width as any, height, borderRadius };

  return (
    <Animated.View
      style={[
        styles.base,
        sizeStyle,
        { opacity: pulseAnim },
        style,
      ]}
    />
  );
}

/** 预置骨架屏布局 — 常用于卡片/列表 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <SkeletonLoader circle size={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader width={120} height={14} />
          <SkeletonLoader width={80} height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={14} style={{ marginTop: 14 }} />
      <SkeletonLoader width="85%" height={14} style={{ marginTop: 8 }} />
      <SkeletonLoader width="60%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

/** 骨架屏行 — 用于任务列表等 */
export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonLoader circle size={28} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLoader width="75%" height={14} />
        <SkeletonLoader width="50%" height={10} />
      </View>
    </View>
  );
}

/** Dashboard 专用骨架屏 */
export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardWrap}>
      {/* Hero */}
      <SkeletonLoader width="100%" height={180} borderRadius={0} />
      {/* Highlight card */}
      <View style={styles.dashSection}>
        <SkeletonLoader width="100%" height={80} borderRadius={br.lg} />
      </View>
      {/* Mood section */}
      <View style={styles.dashSection}>
        <SkeletonLoader width={140} height={18} />
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonLoader key={i} circle size={44} />
          ))}
        </View>
      </View>
      {/* Tasks */}
      <View style={styles.dashSection}>
        <SkeletonLoader width={120} height={18} />
        {[1, 2, 3].map(i => (
          <SkeletonRow key={i} style={{ marginTop: 10 }} />
        ))}
      </View>
    </View>
  );
}

/** Growth 专用骨架屏 */
export function GrowthSkeleton() {
  return (
    <View style={styles.dashboardWrap}>
      <SkeletonLoader width="100%" height={160} borderRadius={0} />
      <View style={styles.dashSection}>
        <View style={styles.moodRow}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} width="30%" height={80} borderRadius={br.lg} />
          ))}
        </View>
      </View>
      <View style={styles.dashSection}>
        <SkeletonLoader width="100%" height={260} borderRadius={br.xl} />
      </View>
    </View>
  );
}

/** Goals 专用骨架屏 */
export function GoalsSkeleton() {
  return (
    <View style={styles.dashboardWrap}>
      <SkeletonLoader width="100%" height={120} borderRadius={0} />
      <View style={styles.dashSection}>
        <SkeletonLoader width="100%" height={44} borderRadius={br.lg} />
      </View>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.dashSection}>
          <SkeletonLoader width="100%" height={110} borderRadius={br.xl} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.skeletonBase,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: br.xl,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  dashboardWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dashSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});
