import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { theme } from './src/utils/theme';
import * as appConfig from './src/config/app.config';
import './src/utils/debugConfig';

// 在启动时检查配置
console.log('=== App Configuration ===');
console.log('API URL:', appConfig.API_BASE_URL);
console.log('Supabase URL:', appConfig.SUPABASE_URL);
console.log('Supabase Key:', appConfig.SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
console.log('Platform:', appConfig.appConfig.platform.os);
console.log('========================');

// 检查必需的配置
if (!appConfig.SUPABASE_URL || !appConfig.SUPABASE_ANON_KEY) {
  console.error('CRITICAL: Supabase configuration is missing!');
  console.error('Please check app.json extra configuration');
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      // 添加更短的超时时间
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Configure React Native Paper theme
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    error: theme.colors.error,
    background: theme.colors.background,
    surface: theme.colors.surface,
    onPrimary: theme.colors.textOnPrimary,
    onSecondary: '#FFFFFF',
    onError: '#FFFFFF',
    onBackground: theme.colors.text,
    onSurface: theme.colors.text,
    primaryContainer: theme.colors.primaryLight,
    onPrimaryContainer: theme.colors.primaryDark,
    secondaryContainer: '#FFB3C1',
    onSecondaryContainer: '#C41C3B',
    tertiaryContainer: '#89DCC5',
    onTertiaryContainer: '#004D3D',
  },
  roundness: theme.borderRadius.md,
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
