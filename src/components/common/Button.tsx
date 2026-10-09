import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Spring constants defined locally
const SPRING = {
  bouncy: { damping: 8, stiffness: 400, mass: 0.5 },
  smooth: { damping: 15, stiffness: 150, mass: 1 },
};

/**
 * Child-Friendly Button Component
 * Features:
 * - Bubble 3D effect with shadow
 * - Press animation (button shrinks when pressed)
 * - Large touch targets for children
 * - Rounded corners
 * - Fun, bright colors
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  // Animated values for press effect
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, SPRING.bouncy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING.smooth);
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          shadowColor: '#E67E22',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          shadowColor: '#DC2626',
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.primaryDark,
        };
    }
  };

  const getTextVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
      case 'text':
        return { color: theme.colors.primary };
      case 'danger':
        return { color: '#fff' };
      default:
        return { color: theme.colors.textOnPrimary };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          minHeight: 40,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          minHeight: 56,
        };
      default:
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          minHeight: 48,
        };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 14 };
      case 'lg':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <Animated.View style={[styles.wrapper, fullWidth && styles.fullWidth, animatedStyle, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {/* Bubble shadow effect for primary/secondary/danger buttons */}
        {(variant === 'primary' || variant === 'secondary' || variant === 'danger') && !disabled && (
          <View style={[styles.bubbleShadow, { backgroundColor: variant === 'secondary' ? '#E67E22' : variant === 'danger' ? '#DC2626' : theme.colors.primaryDark }]} />
        )}

        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'text' ? theme.colors.primary : theme.colors.textOnPrimary}
          />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={size === 'sm' ? 18 : size === 'lg' ? 24 : 20}
                color={variant === 'outline' || variant === 'text' ? theme.colors.primary : theme.colors.textOnPrimary}
                style={styles.icon}
              />
            )}
            <Text style={[styles.text, getTextVariantStyle(), getTextSizeStyle(), textStyle]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  button: {
    borderRadius: theme.borderRadius.lg, // 20px for child-friendly look
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
    // Bubble shadow effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bubbleShadow: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
});
