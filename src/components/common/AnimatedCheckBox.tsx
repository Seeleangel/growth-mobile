/**
 * AnimatedCheckBox Component
 *
 * Child-friendly checkbox with smooth animations:
 * - Scale bounce animation on toggle
 * - Color transition (gray → green)
 * - Checkmark path drawing animation
 *
 * Features:
 * - Large touch target for children
 * - Smooth spring animations
 * - Visual and haptic feedback
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { SPRING, TIMING } from '../../animations/index';

export interface AnimatedCheckBoxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  color?: string;
}

const SIZE_MAP = {
  sm: { container: 24, icon: 14, hitbox: 40 },
  md: { container: 32, icon: 20, hitbox: 48 },
  lg: { container: 40, icon: 26, hitbox: 56 },
} as const;

/**
 * AnimatedCheckBox Component
 *
 * A child-friendly checkbox with playful animations
 *
 * @example
 * ```tsx
 * <AnimatedCheckBox
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 *   size="md"
 * />
 * ```
 */
export const AnimatedCheckBox: React.FC<AnimatedCheckBoxProps> = ({
  checked,
  onCheckedChange,
  size = 'md',
  disabled = false,
  style,
  color = theme.colors.success,
}) => {
  const { container: iconSize, icon: iconFontSize } = SIZE_MAP[size];

  // Animated values
  const scale = useSharedValue(checked ? 1 : 0);
  const rotate = useSharedValue(checked ? 0 : -45);
  const containerScale = useSharedValue(1);
  const checkmarkProgress = useSharedValue(checked ? 1 : 0);

  // Update animation when checked prop changes
  useEffect(() => {
    const targetScale = checked ? 1 : 0;
    const targetRotate = checked ? 0 : -45;
    const targetProgress = checked ? 1 : 0;

    scale.value = withSpring(targetScale, SPRING.bouncy);
    rotate.value = withSpring(targetRotate, {
      damping: 12,
      stiffness: 200,
      mass: 0.6,
    });
    checkmarkProgress.value = withTiming(targetProgress, {
      duration: TIMING.normal,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;

    // Bouncy press animation
    containerScale.value = withSpring(0.85, SPRING.snappy);
    setTimeout(() => {
      containerScale.value = withSpring(1, SPRING.smooth);
    }, 50);

    onCheckedChange(!checked);
  };

  // Container style with scale animation
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  // Background style with color transition
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      checked ? color : 'transparent',
      { duration: TIMING.fast }
    ),
    borderColor: withTiming(
      checked ? color : theme.colors.border,
      { duration: TIMING.fast }
    ),
    transform: [{ scale: scale.value }],
  }));

  // Checkmark style with rotation and scale
  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkmarkProgress.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
      style={[
        styles.hitbox,
        { width: SIZE_MAP[size].hitbox, height: SIZE_MAP[size].hitbox },
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize * 0.3,
          },
          containerAnimatedStyle,
          backgroundAnimatedStyle,
          style,
        ]}
      >
        <Animated.View style={checkmarkAnimatedStyle}>
          <Ionicons
            name="checkmark"
            size={iconFontSize}
            color="#fff"
            style={styles.checkmark}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * AnimatedRadioGroup Component
 *
 * A group of radio-style animated checkboxes where only one can be selected
 */
export interface RadioOption {
  value: string;
  label: string;
}

export interface AnimatedRadioGroupProps {
  options: RadioOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  horizontal?: boolean;
}

export const AnimatedRadioGroup: React.FC<AnimatedRadioGroupProps> = ({
  options,
  selectedValue,
  onValueChange,
  size = 'md',
  disabled = false,
  style,
  horizontal = false,
}) => {
  return (
    <View style={[styles.radioGroup, horizontal && styles.radioGroupHorizontal, style]}>
      {options.map((option) => (
        <AnimatedCheckBox
          key={option.value}
          checked={selectedValue === option.value}
          onCheckedChange={() => onValueChange(option.value)}
          size={size}
          disabled={disabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  hitbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkmark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  radioGroup: {
    flexDirection: 'column',
    gap: 12,
  },
  radioGroupHorizontal: {
    flexDirection: 'row',
    gap: 16,
  },
});
