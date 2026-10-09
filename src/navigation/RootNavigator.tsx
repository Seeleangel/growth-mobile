import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { TeacherNavigator } from './TeacherNavigator';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, isLoading } = useAuth();
  const [loadingFallbackReached, setLoadingFallbackReached] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoadingFallbackReached(false);
      return;
    }

    const timer = setTimeout(() => {
      console.warn('RootNavigator loading fallback triggered, continue rendering app');
      setLoadingFallbackReached(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !loadingFallbackReached) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user.role === 'teacher' ? (
          <Stack.Screen name="TeacherTabs" component={TeacherNavigator} />
        ) : (
          <Stack.Screen name="StudentTabs" component={StudentNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
