import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

export default function RoleSelectScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>欢迎来到乐学成长 🌱</Text>
        <Text style={styles.subtitle}>请选择您的身份</Text>
      </View>
      <View style={styles.options}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Register', { role: 'student' })}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Ionicons name="school-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.optionTitle}>学生 👦👧</Text>
          <Text style={styles.optionDesc}>完成挑战，追踪成长</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Register', { role: 'teacher' })}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
            <Ionicons name="person-outline" size={48} color={theme.colors.secondary} />
          </View>
          <Text style={styles.optionTitle}>教师 👨‍🏫👩‍🏫</Text>
          <Text style={styles.optionDesc}>管理班级，查看分析</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primaryLight,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  options: {
    gap: theme.spacing.lg,
  },
  option: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl, // 40px - very rounded
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.soft,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  optionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
    fontSize: 22,
  },
  optionDesc: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
