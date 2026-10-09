import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

/**
 * Child-Friendly Loading Spinner
 * Features:
 * - Fun leaf icon animation
 * - Cheerful colors
 * - Encouraging messages
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.colors.primary,
  message,
  fullScreen = false,
}) => {
  const content = (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="leaf" size={size === 'large' ? 48 : 32} color={color} />
      </View>
      <ActivityIndicator size={size} color={color} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
});
