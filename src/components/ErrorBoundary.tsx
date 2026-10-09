import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { Button, Card } from './common';
import { isDevelopment } from '../utils/dev';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (isDevelopment()) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color={theme.colors.error} />
            </View>

            <Text style={styles.title}>出错了</Text>
            <Text style={styles.message}>
              抱歉，应用遇到了一个意外错误。请尝试重启应用或联系支持。
            </Text>

            {isDevelopment() && this.state.error && (
              <Card shadow="sm" padding="md" style={styles.errorCard}>
                <Text style={styles.errorTitle}>错误详情（开发模式）</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </Card>
            )}

            <View style={styles.actions}>
              <Button
                title="重新加载"
                onPress={this.resetError}
                icon="refresh-outline"
                fullWidth
              />
            </View>

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>可能的原因：</Text>
              <Text style={styles.tipsText}>• 网络连接问题</Text>
              <Text style={styles.tipsText}>• 服务器暂时不可用</Text>
              <Text style={styles.tipsText}>• 应用数据损坏</Text>
              <Text style={styles.tipsText}>• 权限设置问题</Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorCard: {
    width: '100%',
    marginBottom: theme.spacing.lg,
    backgroundColor: `${theme.colors.error}10`,
  },
  errorTitle: {
    ...theme.typography.label,
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  tips: {
    width: '100%',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  tipsTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipsText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});
