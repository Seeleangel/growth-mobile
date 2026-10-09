import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../utils/theme';
import { Button, Input } from '../../components/common';

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = '请输入姓名';
    }

    if (!email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少需要 6 位';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim(), role);
      Alert.alert('注册成功', '🎉 请查收验证邮件后登录', [
        { text: '确定', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.primary} />
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>创建账号 ✨</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>我是 👇</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
              onPress={() => setRole('student')}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconContainer}>
                <Ionicons
                  name="school-outline"
                  size={36}
                  color={role === 'student' ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>
                学生
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'teacher' && styles.roleButtonActive]}
              onPress={() => setRole('teacher')}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={36}
                  color={role === 'teacher' ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>
                教师
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="姓名"
            placeholder="请输入姓名"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
            error={errors.fullName}
          />

          <Input
            label="邮箱"
            placeholder="请输入邮箱"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="密码"
            placeholder="请输入密码（至少 6 位）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="确认密码"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <Button
            title="注册 🎉"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            size="lg"
            style={styles.registerButton}
          />

          <Button
            title="已有账号？立即登录"
            onPress={() => navigation.navigate('Login')}
            variant="text"
            size="md"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 16,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: '700',
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl, // 40px
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.soft,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    fontWeight: '700',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl, // 28px
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 3,
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl, // 28px
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  roleText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  roleTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
});
