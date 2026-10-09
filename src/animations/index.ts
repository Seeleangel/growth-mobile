/**
 * Animation Configuration
 *
 * Child-friendly animation timing and spring configurations
 * All timings are optimized for children's visual processing
 */

// Animation durations (in milliseconds)
// Based on child-friendly UX research
export const TIMING = {
  instant: 150,    // Quick feedback (button press, toggle)
  fast: 250,       // Page transitions, simple movements
  normal: 350,     // List items, cards entering
  slow: 500,       // Progress bars, loading states
  celebration: 800, // Success animations, achievements
} as const;

// Spring physics configurations
// Using Reanimated 3 spring physics
export const SPRING = {
  // Bouncy - for button presses, playful interactions
  bouncy: {
    damping: 8,
    stiffness: 400,
    mass: 0.5,
  },

  // Smooth - for card movements, gentle transitions
  smooth: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Snappy - for quick responses, toggle switches
  snappy: {
    damping: 10,
    stiffness: 300,
    mass: 0.3,
  },

  // Gentle - for modal appearances, subtle feedback
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
} as const;

// Easing functions for non-spring animations
import { Easing } from 'react-native';

export const EASING = {
  // Smooth ease-in-out
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Quick snappy ease-out
  snappy: Easing.bezier(0.34, 1.56, 0.64, 1),

  // Bouncy ease-out (for celebrations)
  bouncy: Easing.bezier(0.34, 1.56, 0.64, 1),

  // Smooth ease-in
  fadeIn: Easing.bezier(0.4, 0, 1, 1),
} as const;

// Accessibility - respect reduce motion preference
export const shouldAnimate = async (): Promise<boolean> => {
  try {
    const { AccessibilityInfo } = await import('expo-accessibility');
    const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    return !reduceMotionEnabled;
  } catch {
    return true; // Default to animating if module not available
  }
};

// Common animation presets
export const PRESETS = {
  // Quick scale animation for buttons
  buttonPress: {
    duration: TIMING.instant,
    easing: EASING.bouncy,
  },

  // Card appearance
  cardEntrance: {
    duration: TIMING.normal,
    easing: EASING.smooth,
  },

  // Success celebration
  successBounce: {
    damping: SPRING.bouncy.damping,
    stiffness: SPRING.bouncy.stiffness,
  },

  // Page transition
  pageSlide: {
    duration: TIMING.fast,
    easing: EASING.smooth,
  },
} as const;
