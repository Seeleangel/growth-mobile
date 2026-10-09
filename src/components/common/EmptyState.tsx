import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../utils/theme';
import SmoothImage from './SmoothImage';
import { Images } from '../../assets/images';

interface EmptyStateProps {
  icon?: string;
  /** Use a real image instead of emoji */
  image?: ImageSourcePropType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Simple SVG illustrations as emoji-based icons
const ILLUSTRATIONS: Record<string, string> = {
  noData: '📭',
  noTasks: '✅',
  noGoals: '🎯',
  noNetwork: '📡',
  error: '⚠️',
  success: '🎉',
  loading: '⏳',
  noMoods: '😊',
  noChallenges: '🏆',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  image,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const displayIcon = icon ? ILLUSTRATIONS[icon] || icon : ILLUSTRATIONS.noData;
  // Default to the empty-state illustration if no specific image provided
  const imgSource = image || Images.emptyState;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.container}>
      <SmoothImage
        source={imgSource}
        style={{ width: 160, height: 160, borderRadius: 16 }}
        delay={50}
        duration={500}
      />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.soft,
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
  },
  actionLabel: {
    color: theme.colors.textOnPrimary,
    ...theme.typography.label,
    fontWeight: '700',
  },
});
