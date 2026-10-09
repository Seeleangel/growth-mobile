import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import StudentsScreen from '../screens/teacher/StudentsScreen';
import SubmissionsScreen from '../screens/teacher/SubmissionsScreen';
import AnalyticsScreen from '../screens/teacher/AnalyticsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TeacherNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'TeacherHome':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Students':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Submissions':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen
        name="TeacherHome"
        component={TeacherDashboardScreen}
        options={{ tabBarLabel: '工作台' }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ tabBarLabel: '学生' }}
      />
      <Tab.Screen
        name="Submissions"
        component={SubmissionsScreen}
        options={{ tabBarLabel: '提交' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarLabel: '分析' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
};
