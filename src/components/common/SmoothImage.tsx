/**
 * SmoothImage – a premium image component with:
 *  • Progressive fade-in + subtle scale-up on mount
 *  • Shimmer placeholder while loading
 *  • Smooth crossfade from placeholder → image
 *
 * Usage:
 *   <SmoothImage source={Images.celebrate} style={{ width: 200, height: 200 }} />
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/theme';

interface Props {
  source: ImageSourcePropType;
  style?: ImageStyle | ViewStyle | (ImageStyle | ViewStyle)[];
  /** Delay before entrance animation starts (ms) */
  delay?: number;
  /** Duration of fade-in (ms) */
  duration?: number;
  /** If true, show subtle shimmer while loading */
  shimmer?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export default function SmoothImage({
  source,
  style,
  delay = 0,
  duration = 500,
  shimmer = true,
  resizeMode = 'contain',
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const progress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  // Start shimmer loop
  React.useEffect(() => {
    if (!loaded && shimmer) {
      const loop = () => {
        shimmerProgress.value = withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        );
      };
      loop();
      const id = setInterval(loop, 2000);
      return () => clearInterval(id);
    }
  }, [loaded, shimmer]);

  const onLoad = useCallback(() => {
    setLoaded(true);
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration]);

  const imageAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 1], [0.35, 0.65]),
  }));

  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <View style={[sh.wrapper, { width: flatStyle.width, height: flatStyle.height, borderRadius: (flatStyle as any).borderRadius || 0 }]}>
      {/* Shimmer placeholder */}
      {!loaded && shimmer && (
        <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
          <LinearGradient
            colors={[colors.surface, colors.borderLight, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
      {/* Actual image with animated wrapper */}
      <Animated.View style={[StyleSheet.absoluteFillObject, imageAnimStyle]}>
        <Image
          source={source}
          style={[style as ImageStyle, { position: 'absolute' as const, top: 0, left: 0 }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
        />
      </Animated.View>
    </View>
  );
}

const sh = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
});
