/**
 * useEntranceAnimation Hook
 *
 * Provides a smooth entrance animation for components
 * Fades in and slides up from a starting position
 *
 * @param delay - Delay in milliseconds before animation starts (default: 0)
 * @param distance - Distance to slide in pixels (default: 20)
 * @returns Animated style object
 */
import { useEffect } from 'react';
import { Easing } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// Constants defined locally to avoid circular dependency
const TIMING = {
  instant: 150,
  fast: 250,
  normal: 350,
  slow: 500,
  celebration: 800,
};

const EASING = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const shouldAnimate = async (): Promise<boolean> => {
  try {
    const { AccessibilityInfo } = await import('expo-accessibility');
    const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    return !reduceMotionEnabled;
  } catch {
    return true;
  }
};

interface EntranceAnimationOptions {
  delay?: number;
  distance?: number;
  duration?: number;
}

export const useEntranceAnimation = (options: EntranceAnimationOptions = {}) => {
  const { delay = 0, distance = 20, duration = TIMING.normal } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    let isMounted = true;

    // Check if animations are enabled
    shouldAnimate().then(canAnimate => {
      if (!isMounted) return;

      if (canAnimate) {
        // Animate opacity and position
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: duration * 0.6, easing: EASING.smooth })
        );
        translateY.value = withDelay(
          delay,
          withTiming(0, { duration, easing: EASING.smooth })
        );
      } else {
        // Skip animation for reduce motion
        opacity.value = 1;
        translateY.value = 0;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [delay, distance, duration]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
};

/**
 * useScaleInAnimation Hook
 *
 * Provides a scale-in entrance animation
 * Useful for icons, badges, and small elements
 *
 * @param delay - Delay in milliseconds before animation starts
 * @param fromScale - Starting scale (default: 0)
 * @returns Animated style object
 */
export const useScaleInAnimation = (delay = 0, fromScale = 0.5) => {
  const scale = useSharedValue(fromScale);

  useEffect(() => {
    let isMounted = true;

    shouldAnimate().then(canAnimate => {
      if (!isMounted) return;

      if (canAnimate) {
        scale.value = withDelay(
          delay,
          withSpring({
            toValue: 1,
            damping: 15,
            stiffness: 150,
            mass: 0.5,
          })
        );
      } else {
        scale.value = 1;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [delay, fromScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
};

/**
 * useSlideInRightAnimation Hook
 *
 * Provides a slide-in from right animation
 * Useful for modals and side panels
 *
 * @param delay - Delay in milliseconds before animation starts
 * @returns Animated style object
 */
export const useSlideInRightAnimation = (delay = 0) => {
  const translateX = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let isMounted = true;

    shouldAnimate().then(canAnimate => {
      if (!isMounted) return;

      if (canAnimate) {
        translateX.value = withDelay(
          delay,
          withTiming(0, { duration: TIMING.fast, easing: EASING.smooth })
        );
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: TIMING.fast * 0.5 })
        );
      } else {
        translateX.value = 0;
        opacity.value = 1;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [delay]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
};

/**
 * usePulseAnimation Hook
 *
 * Provides a pulsing animation (scale up and down)
 * Useful for drawing attention to important elements
 *
 * @param pulseInterval - Interval between pulses in ms (default: 1500)
 * @returns Animated style object
 */
export const usePulseAnimation = (pulseInterval = 1500) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    let isMounted = true;

    shouldAnimate().then(canAnimate => {
      if (!isMounted) return;

      if (canAnimate) {
        // Create pulsing effect
        const pulse = () => {
          scale.value = withSequence(
            withTiming(1.05, { duration: 150, easing: EASING.smooth }),
            withTiming(1, { duration: 150, easing: EASING.smooth }),
            withDelay(pulseInterval - 300, pulse)
          );
        };

        scale.value = withTiming(1.05, { duration: 100 });
        const id = setInterval(() => {
          if (isMounted) {
            pulse();
          }
        }, pulseInterval);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pulseInterval]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
};
