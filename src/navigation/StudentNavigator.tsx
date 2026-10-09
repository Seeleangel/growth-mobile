import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, shadows, borderRadius, glass, motion, spacing as sp, typography } from '../utils/theme';

import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import ChallengeScreen from '../screens/student/ChallengeScreen';
import GrowthScreen from '../screens/student/GrowthScreen';
import GoalsScreen from '../screens/student/GoalsScreen';
import MomentsScreen from '../screens/student/MomentsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

// ===========================================================================
// Premium Tab Bar Icon with animated pill background
// ===========================================================================
interface TabIconProps {
  route: string;
  focused: boolean;
  color: string;
}

const ICON_MAP: Record<string, { active: string; inactive: string }> = {
  Home:      { active: 'home',          inactive: 'home-outline' },
  Challenge: { active: 'flash',         inactive: 'flash-outline' },
  Growth:    { active: 'leaf',          inactive: 'leaf-outline' },
  Goals:     { active: 'flag',          inactive: 'flag-outline' },
  Moments:   { active: 'chatbubbles',   inactive: 'chatbubbles-outline' },
  Profile:   { active: 'person-circle', inactive: 'person-circle-outline' },
};

function AnimatedTabIcon({ route, focused }: TabIconProps) {
  const scaleValue = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scaleValue.value = withSpring(focused ? 1 : 0, motion.spring.snappy);
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + scaleValue.value * 0.15 }],
    backgroundColor: interpolateColor(
      scaleValue.value,
      [0, 1],
      ['transparent', colors.primaryMuted]
    ),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }));

  const icons = ICON_MAP[route] || ICON_MAP.Home;
  const iconName = focused ? icons.active : icons.inactive;

  return (
    <Animated.View style={pillStyle}>
      <Ionicons
        name={iconName as any}
        size={focused ? 24 : 22}
        color={focused ? colors.primary : colors.textTertiary}
      />
    </Animated.View>
  );
}

export const StudentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'shift',
        tabBarIcon: ({ focused, color }) => (
          <AnimatedTabIcon route={route.name} focused={focused} color={color} />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: tabStyles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={StudentDashboardScreen} />
      <Tab.Screen name="Challenge" component={ChallengeScreen} />
      <Tab.Screen name="Growth" component={GrowthScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Moments" component={MomentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 12 : 20,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.lg,
    ...(Platform.OS === 'web' ? {
      // @ts-ignore
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    } : {}),
    paddingHorizontal: 8,
    paddingBottom: 0,
    elevation: 12,
  },
});
