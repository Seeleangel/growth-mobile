/**
 * SuccessAnimation Component
 *
 * Child-friendly success/celebration animation with:
 * - Expanding circle background
 * - Animated checkmark drawing
 * - Confetti particle explosion
 *
 * Perfect for:
 * - Task completion
 * - Achievement unlocks
 * - Correct answers
 * - Level progression
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { TIMING, SPRING, shouldAnimate } from '../index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SuccessAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  size?: number;
  color?: string;
  showConfetti?: boolean;
  autoHide?: boolean;
  duration?: number;
}

/**
 * ConfettiParticle Component
 *
 * Individual confetti piece with physics animation
 */
interface ConfettiParticleProps {
  index: number;
  total: number;
  colors: string[];
  size: number;
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({
  index,
  total,
  colors,
  size,
}) => {
  // Randomize initial position and animation
  const angle = (index / total) * Math.PI * 2;
  const distance = size * 0.8 + Math.random() * size * 0.4;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    shouldAnimate().then(canAnimate => {
      if (canAnimate) {
        // Explode outward
        translateX.value = withDelay(
          50,
          withSpring(Math.cos(angle) * distance, SPRING.bouncy)
        );
        translateY.value = withDelay(
          50,
          withSpring(Math.sin(angle) * distance - distance * 0.5, {
            ...SPRING.bouncy,
            mass: 0.8,
          })
        );
        rotate.value = withDelay(
          50,
          withSpring(Math.random() * 720 - 360, { damping: 8, stiffness: 100 })
        );
        scale.value = withDelay(
          50,
          withSpring(1, SPRING.bouncy)
        );

        // Fade out after animation
        opacity.value = withDelay(
          800,
          withTiming(0, { duration: 300 })
        );
      } else {
        scale.value = 0;
        opacity.value = 0;
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const color = colors[index % colors.length];
  const particleSize = size * 0.08 + Math.random() * size * 0.04;

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: particleSize, height: particleSize },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.particleInner,
          { backgroundColor: color, borderRadius: particleSize / 2 },
        ]}
      />
    </Animated.View>
  );
};

/**
 * SuccessAnimation Component
 *
 * Full success animation with circle, checkmark, and optional confetti
 *
 * @example
 * ```tsx
 * <SuccessAnimation
 *   visible={showSuccess}
 *   onComplete={() => setShowSuccess(false)}
 *   showConfetti={true}
 *   autoHide={true}
 * />
 * ```
 */
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  onComplete,
  size = 120,
  color = theme.colors.success,
  showConfetti = true,
  autoHide = true,
  duration = 2000,
}) => {
  const hasTriggered = useRef(false);

  // Animated values
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const checkmarkProgress = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0);

  const triggerAnimation = () => {
    if (!visible) {
      // Reset
      circleScale.value = 0;
      circleOpacity.value = 0;
      checkmarkProgress.value = 0;
      checkmarkScale.value = 0;
      containerOpacity.value = 0;
      containerScale.value = 0;
      hasTriggered.current = false;
      return;
    }

    if (hasTriggered.current) return;
    hasTriggered.current = true;

    shouldAnimate().then(canAnimate => {
      if (!canAnimate) {
        // Skip animation, just show
        containerOpacity.value = 1;
        circleScale.value = 1;
        checkmarkProgress.value = 1;
        if (autoHide && onComplete) {
          setTimeout(onComplete, 500);
        }
        return;
      }

      // Container fade in
      containerOpacity.value = withTiming(1, { duration: 150 });
      containerScale.value = withSpring(1, SPRING.gentle);

      // Circle expand animation
      circleScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.2, { duration: TIMING.normal, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) })
      );
      circleOpacity.value = withTiming(1, { duration: TIMING.fast });

      // Checkmark animation (starts after circle)
      checkmarkScale.value = withDelay(
        TIMING.fast,
        withSpring(1, SPRING.bouncy)
      );

      // Checkmark path drawing simulation (scale for simplicity)
      checkmarkProgress.value = withDelay(
        TIMING.fast,
        withTiming(1, { duration: TIMING.fast })
      );

      // Auto hide after duration
      if (autoHide && onComplete) {
        setTimeout(() => {
          containerOpacity.value = withTiming(0, { duration: 300 });
          runOnJS(onComplete)();
        }, duration);
      }
    });
  };

  useEffect(() => {
    triggerAnimation();
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkProgress.value,
  }));

  if (!visible) return null;

  const confettiColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  return (
    <View style={[styles.container, StyleSheet.absoluteFill]}>
      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {/* Confetti particles */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: 16 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                index={i}
                total={16}
                colors={confettiColors}
                size={size}
              />
            ))}
          </View>
        )}

        {/* Success circle */}
        <Animated.View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            circleAnimatedStyle,
          ]}
        >
          <View
            style={[
              styles.circleInner,
              {
                width: size,
              height: size,
              borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
          />
        </Animated.View>

        {/* Checkmark */}
        <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
          <Ionicons name="checkmark" size={size * 0.5} color="#fff" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

/**
 * MiniSuccessAnimation Component
 *
 * Smaller inline success animation for buttons, cards, etc.
 */
export interface MiniSuccessAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
}

export const MiniSuccessAnimation: React.FC<MiniSuccessAnimationProps> = ({
  visible,
  size = 40,
  color = theme.colors.success,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      shouldAnimate().then(canAnimate => {
        if (canAnimate) {
          scale.value = withSequence(
            withSpring(1.2, SPRING.bouncy),
            withSpring(1, SPRING.smooth)
          );
          opacity.value = withTiming(1, { duration: 150 });
        } else {
          scale.value = 1;
          opacity.value = 1;
        }
      });
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.miniContainer, animatedStyle]}>
      <View
        style={[
          styles.miniCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Ionicons name="checkmark" size={size * 0.5} color="#fff" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  circleInner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkContainer: {
    position: 'absolute',
  },
  confettiContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particleInner: {
    width: '100%',
    height: '100%',
  },
  miniContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
