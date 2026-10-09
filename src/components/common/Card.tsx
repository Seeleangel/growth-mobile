import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg' | 'soft' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'warm';
  onPress?: () => void;
  pressable?: boolean;
}

// Spring constants defined locally
const SPRING = {
  smooth: { damping: 15, stiffness: 150, mass: 1 },
};

/**
 * Child-Friendly Card Component
 * Features:
 * - Larger rounded corners (28px)
 * - White border for depth
 * - Warm, soft shadows
 * - Gentle background colors
 * - Touch animations (lift and scale effect)
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  shadow = 'soft',
  padding = 'md',
  variant = 'default',
  onPress,
  pressable = false,
}) => {
  // Animated values for touch effect
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handleTouchStart = () => {
    if (pressable || onPress) {
      scale.value = withSpring(1.02, SPRING.smooth);
      translateY.value = withSpring(-4, SPRING.smooth);
    }
  };

  const handleTouchEnd = () => {
    scale.value = withSpring(1, SPRING.smooth);
    translateY.value = withSpring(0, SPRING.smooth);
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: theme.spacing.sm };
      case 'lg':
        return { padding: theme.spacing.lg };
      default:
        return { padding: theme.spacing.md };
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows[shadow],
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'warm':
        return {
          backgroundColor: theme.colors.surfaceWarm,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.soft,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.soft,
        };
    }
  };

  const cardContent = (
    <Animated.View style={[styles.card, getPaddingStyle(), getVariantStyle(), animatedStyle, style]}>
      {children}
    </Animated.View>
  );

  // If pressable or has onPress, wrap with TouchableOpacity
  if (pressable || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        activeOpacity={1}
        style={style}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
});
