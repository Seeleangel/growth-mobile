/**
 * OnboardingScreen – A beautiful single-page welcome screen
 * Uses the 引导页插画.png illustration with smooth entrance animations
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing as sp, typography, borderRadius, shadows } from '../../utils/theme';
import { SmoothImage } from '../../components/common';
import { Images } from '../../assets/images';
import { storageService } from '../../services/storageService';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: Props) {
  const btnScale = useSharedValue(0);
  const dotProgress = useSharedValue(0);
  const { width: winW, height: winH } = useWindowDimensions();
  // Responsive illustration size: clamp between 200–380px, or 55% of screen width
  const heroSize = Math.min(Math.max(winW * 0.55, 200), 380);

  useEffect(() => {
    dotProgress.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    btnScale.value = withDelay(1200, withSpring(1, { damping: 12, stiffness: 120 }));
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnScale.value,
    transform: [{ scale: btnScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotProgress.value,
  }));

  const handleStart = async () => {
    await storageService.setOnboardingCompleted(true);
    navigation.replace('Login');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[colors.primaryMuted, '#F0FDF4', colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero illustration */}
        <Animated.View entering={FadeInUp.delay(200).duration(700).springify()} style={s.heroWrap}>
          <SmoothImage
            source={Images.onboarding}
            style={{ width: heroSize, height: heroSize, borderRadius: 24 }}
            delay={100}
            duration={600}
          />
        </Animated.View>

        {/* Text content */}
        <Animated.View entering={FadeInDown.delay(500).duration(600).springify()} style={s.textBlock}>
          <Text style={s.title}>欢迎来到 PreGrow</Text>
          <Text style={s.subtitle}>
            记录成长每一步{'\n'}遇见更好的自己
          </Text>
        </Animated.View>

        {/* Pagination dots */}
        <Animated.View style={[s.dotsRow, dotStyle]}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View style={[s.btnWrap, btnStyle]}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleStart} style={s.btnInner}>
            <LinearGradient
              colors={gradients.primaryHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.btnGradient}
            >
              <Text style={s.btnText}>开始探索 →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp.lg,
    paddingTop: sp['3xl'],
    paddingBottom: sp['3xl'],
  },
  heroWrap: {
    alignItems: 'center',
    ...shadows.soft,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: sp.xl,
    paddingHorizontal: sp.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: sp.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sp.xl,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  btnWrap: {
    marginTop: sp['3xl'],
    width: '100%',
    paddingHorizontal: sp.lg,
  },
  btnInner: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
