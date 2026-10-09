import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="leaf" size={48} color={theme.colors.primary} />
      </View>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  iconContainer: {
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
