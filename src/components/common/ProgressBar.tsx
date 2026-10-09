import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, DimensionValue } from 'react-native';
import { theme } from '../../utils/theme';

interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  progress: number;
  /** Width of the progress bar (default: 100%) */
  width?: DimensionValue;
  /** Height of the progress bar */
  height?: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Custom color for the progress fill */
  color?: string;
  /** Enable striped animation */
  animated?: boolean;
  /** Style override */
  style?: any;
}

/**
 * Child-Friendly Progress Bar Component
 * Features:
 * - Rounded corners
 * - Bright, cheerful colors
 * - Optional percentage display
 * - Smooth animation
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  width = '100%',
  height = 12,
  showPercentage = false,
  color = theme.colors.primary,
  animated = true,
  style,
}) => {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Animation for the progress fill
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress fill
    Animated.timing(progressAnim, {
      toValue: clampedProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, animated]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { width, height }]}>
        {/* Progress Fill */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
              height,
            },
          ]}
        />

        {/* Shine effect */}
        <View style={[styles.shine, { height }]} />
      </View>

      {/* Percentage text */}
      {showPercentage && (
        <Text style={styles.percentage}>
          {Math.round(clampedProgress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  track: {
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    borderRadius: theme.borderRadius.full,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.full,
  },
  percentage: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
});
