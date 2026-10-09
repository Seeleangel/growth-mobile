import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  colors, gradients, shadows, borderRadius, spacing as sp,
  typography, glass, layout,
} from '../../utils/theme';
import { theme } from '../../utils/theme';
import { Button, Input, SmoothImage } from '../../components/common';
import { Images } from '../../assets/images';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    if (!password.trim()) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={ls.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.primaryMuted, colors.background, colors.secondaryLight]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={ls.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Brand */}
          <Animated.View entering={FadeIn.duration(600)} style={ls.header}>
            <View style={ls.logoCircle}>
              <SmoothImage
                source={Images.appIcon}
                style={{ width: 88, height: 88, borderRadius: 44 }}
                delay={200}
                duration={600}
                resizeMode="cover"
              />
            </View>
            <Text style={ls.brand}>乐学成长</Text>
            <Text style={ls.tagline}>每天进步一点点</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={ls.formCard}>
              <Text style={ls.formTitle}>登录</Text>

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
                placeholder="请输入密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.password}
              />

              <Button
                title="登录"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                size="lg"
                style={ls.loginBtn}
              />

              <Button
                title="还没有账号？立即注册"
                onPress={() => navigation.navigate('Register')}
                variant="text"
                size="md"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: sp['2xl'], paddingVertical: sp['4xl'],
  },
  header: { alignItems: 'center', marginBottom: sp['4xl'] },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: sp.lg,
    ...shadows.glow,
  },
  brand: {
    ...typography.displaySm, color: colors.text, fontWeight: '800',
  },
  tagline: {
    ...typography.body, color: colors.textSecondary, marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: sp['2xl'],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formTitle: {
    ...typography.h1, color: colors.text, marginBottom: sp.xl, fontWeight: '700',
  },
  loginBtn: { marginTop: sp.lg },
});
