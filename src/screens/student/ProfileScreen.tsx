import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
  ScrollView, Modal, TextInput, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import {
  colors, gradients, shadows, borderRadius,
  typography, layout, spacing as sp,
} from '../../utils/theme';
import { Avatar } from '../../components/common';

// ─────────────────────────────────────────────
//  Profile Screen
// ─────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editDream, setEditDream] = useState(user?.dream || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Stats query ──
  const { data: stats } = useQuery({
    queryKey: ['studentStats', user?.id],
    queryFn: () => apiService.getStudentStats(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Profile update mutation ──
  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name?: string; dream?: string; bio?: string }) =>
      apiService.updateProfile(user!.id, data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
      setEditModal(false);
    },
    onError: () => Alert.alert('保存失败', '请稍后重试'),
  });

  // ── Avatar upload ──
  const handleAvatarPress = () => {
    Alert.alert('更换头像', '', [
      { text: '拍照', onPress: () => pickAvatar('camera') },
      { text: '从相册选择', onPress: () => pickAvatar('gallery') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const pickAvatar = async (source: 'camera' | 'gallery') => {
    try {
      const perm = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('需要权限', source === 'camera' ? '请允许访问相机' : '请允许访问相册');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) { Alert.alert('图片读取失败'); return; }

      setUploadingAvatar(true);
      try {
        const ext = asset.uri.split('.').pop() || 'jpg';
        await apiService.uploadAvatar(user!.id, {
          fileName: `avatar_${Date.now()}.${ext}`,
          mimeType: asset.mimeType || 'image/jpeg',
          dataBase64: base64,
        });
        await refreshUser();
      } catch {
        Alert.alert('上传失败', '请检查网络后重试');
      } finally {
        setUploadingAvatar(false);
      }
    } catch {
      setUploadingAvatar(false);
    }
  };

  // ── Open edit modal (sync current values) ──
  const openEdit = () => {
    setEditName(user?.full_name || '');
    setEditDream(user?.dream || '');
    setEditBio(user?.bio || '');
    setEditModal(true);
  };

  const saveProfile = () => {
    if (!editName.trim()) { Alert.alert('请填写姓名'); return; }
    updateProfileMutation.mutate({
      full_name: editName.trim(),
      dream: editDream.trim(),
      bio: editBio.trim(),
    });
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const isStudent = user?.role === 'student';
  const levelLabel = stats?.level ? `Lv.${stats.level.level}` : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] }),
    ]);
    setRefreshing(false);
  }, [user?.id, queryClient, refreshUser]);

  return (
    <View style={ps.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        {/* ── Hero Header ── */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={gradients.primaryHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ps.hero}
          >
            {/* Decorative bubbles in their own clipped layer so they don't block touches */}
            <View style={ps.bubbleLayer} pointerEvents="none">
              <View style={[ps.bubble, { top: -30, right: -20, width: 140, height: 140 }]} />
              <View style={[ps.bubble, { bottom: 20, left: -30, width: 90, height: 90 }]} />
            </View>

            {/* Edit button */}
            <TouchableOpacity style={ps.editHeroBtn} onPress={openEdit} activeOpacity={0.8}>
              <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>

            {/* Avatar */}
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={ps.avatarWrap}>
              <View style={ps.avatarRing}>
                {uploadingAvatar ? (
                  <View style={ps.avatarPlaceholder}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={ps.avatarImg} />
                ) : (
                  <Avatar name={user?.full_name} size={84} />
                )}
              </View>
              <View style={ps.cameraBadge}>
                <Ionicons name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={ps.name}>{user?.full_name || '未设置'}</Text>

            {user?.dream ? (
              <View style={ps.dreamPill}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={ps.dreamText} numberOfLines={1}>期待：{user.dream}</Text>
              </View>
            ) : null}

            <View style={ps.tagRow}>
              <View style={ps.rolePill}>
                <Ionicons name={isStudent ? 'school' : 'briefcase'} size={12} color="#fff" />
                <Text style={ps.roleText}>{isStudent ? '学生' : '教师'}</Text>
              </View>
              {levelLabel && (
                <View style={ps.levelPill}>
                  <Ionicons name="trophy" size={12} color="#FBBF24" />
                  <Text style={ps.levelText}>{levelLabel}</Text>
                </View>
              )}
            </View>

            <Text style={ps.email}>{user?.email}</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Bar ── */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={ps.statsBar}>
          <StatCell icon="flame" iconColor="#EF4444" value={stats?.streak ?? '—'} label="连续打卡" />
          <View style={ps.statDivider} />
          <StatCell icon="ribbon" iconColor="#F59E0B" value={stats?.badges ?? '—'} label="获得徽章" />
          <View style={ps.statDivider} />
          <StatCell icon="checkmark-circle" iconColor="#10B981" value={stats?.completed_tasks ?? '—'} label="完成任务" />
        </Animated.View>

        {/* ── Info Card ── */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={ps.infoCard}>
          {user?.dream ? (
            <InfoRow icon="star-outline" iconColor="#FBBF24" label="我的期待" value={user.dream} />
          ) : (
            <InfoRow icon="star-outline" iconColor="#FBBF24" label="我的期待" value="尚未设置，点击「编辑」添加" dim />
          )}
          {user?.bio ? (
            <InfoRow icon="chatbubble-ellipses-outline" iconColor={colors.accent} label="个人简介" value={user.bio} />
          ) : null}
          <InfoRow icon="business-outline" iconColor={colors.secondary} label="学校" value={user?.school_name || '未设置'} />
          <InfoRow icon="people-outline" iconColor={colors.primary} label="班级" value={user?.class_name || '未设置'} last />
        </Animated.View>

        {/* ── Actions ── */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={ps.actionsCard}>
          <ActionRow icon="create-outline" iconColor={colors.primary} label="编辑个人信息" onPress={openEdit} />
          <ActionRow
            icon="lock-closed-outline"
            iconColor={colors.secondary}
            label="账号与安全"
            onPress={() => Alert.alert('敬请期待', '该功能正在开发中')}
            last
          />
        </Animated.View>

        {/* ── Logout ── */}
        <Animated.View entering={FadeInDown.delay(420).springify()} style={ps.logoutWrap}>
          <TouchableOpacity style={ps.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={ps.logoutText}>退出登录</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: layout.tabBarHeight + sp['3xl'] }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={ps.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={ps.modalSheet}>
            <View style={ps.modalHandle} />
            <Text style={ps.modalTitle}>编辑个人信息</Text>

            <Text style={ps.fieldLabel}>姓名</Text>
            <TextInput
              style={ps.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="你的名字"
              placeholderTextColor={colors.textMuted}
              maxLength={20}
            />

            <Text style={ps.fieldLabel}>我的期待</Text>
            <TextInput
              style={ps.fieldInput}
              value={editDream}
              onChangeText={setEditDream}
              placeholder="你最期待实现什么？"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
            />

            <Text style={ps.fieldLabel}>个人简介</Text>
            <TextInput
              style={[ps.fieldInput, ps.fieldTextArea]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="介绍一下你自己…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={80}
            />

            <View style={ps.modalBtnRow}>
              <TouchableOpacity
                style={ps.cancelBtn}
                onPress={() => setEditModal(false)}
                disabled={updateProfileMutation.isPending}
              >
                <Text style={ps.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={ps.saveBtn}
                onPress={saveProfile}
                disabled={updateProfileMutation.isPending}
                activeOpacity={0.8}
              >
                {updateProfileMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={ps.saveBtnText}>保存</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────
function StatCell({ icon, iconColor, value, label }: {
  icon: string; iconColor: string; value: number | string; label: string;
}) {
  return (
    <View style={ps.statCell}>
      <Ionicons name={icon as any} size={20} color={iconColor} style={{ marginBottom: 4 }} />
      <Text style={ps.statValue}>{value}</Text>
      <Text style={ps.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, iconColor, label, value, last, dim }: {
  icon: string; iconColor: string; label: string; value: string; last?: boolean; dim?: boolean;
}) {
  return (
    <View style={[ps.row, !last && ps.rowBorder]}>
      <View style={ps.rowLeft}>
        <View style={[ps.iconCircle, { backgroundColor: `${iconColor}18` }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={ps.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[ps.rowValue, dim && { color: colors.textMuted, fontStyle: 'italic', fontSize: 12 }]}
        numberOfLines={1}
      >{value}</Text>
    </View>
  );
}

function ActionRow({ icon, iconColor, label, onPress, last }: {
  icon: string; iconColor: string; label: string; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity style={[ps.row, !last && ps.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={ps.rowLeft}>
        <View style={[ps.iconCircle, { backgroundColor: `${iconColor}18` }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={ps.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 56 : 72,
    paddingBottom: 36,
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
    position: 'relative',
  },
  bubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
  },
  bubble: {
    position: 'absolute', borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editHeroBtn: {
    position: 'absolute', top: Platform.OS === 'web' ? 18 : 54, right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 50, padding: 3,
  },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  cameraBadge: {
    position: 'absolute', bottom: 3, right: 3,
    backgroundColor: colors.primary,
    borderRadius: 12, width: 24, height: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { ...typography.h1, color: '#fff', fontWeight: '800' },
  dreamPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: borderRadius.full, marginTop: 6, maxWidth: 260,
  },
  dreamText: { ...typography.caption, color: '#fff', fontWeight: '600', flex: 1 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: borderRadius.full,
  },
  roleText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(251,191,36,0.25)',
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  levelText: { ...typography.caption, color: '#FBBF24', fontWeight: '800' },
  email: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 10 },

  // Stats
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: layout.screenPadding,
    marginTop: -20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    padding: 16,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.text, fontWeight: '800', lineHeight: 28 },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderLight },

  // Cards
  infoCard: {
    marginHorizontal: layout.screenPadding,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    overflow: 'hidden',
  },
  actionsCard: {
    marginHorizontal: layout.screenPadding,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { ...typography.body, color: colors.text, fontWeight: '500' },
  rowValue: { ...typography.body, color: colors.textSecondary, maxWidth: 140, textAlign: 'right' },

  // Logout
  logoutWrap: { marginHorizontal: layout.screenPadding, marginTop: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.error}08`,
    borderWidth: 1, borderColor: `${colors.error}20`,
  },
  logoutText: { ...typography.button, color: colors.error },

  // Edit Modal
  modalOverlay: {
    flex: 1, backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { ...typography.h2, color: colors.text, fontWeight: '800', marginBottom: 20 },
  fieldLabel: {
    ...typography.caption, color: colors.textSecondary, fontWeight: '600',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: colors.borderLight,
    paddingHorizontal: 14, paddingVertical: 12,
    ...typography.body, color: colors.text,
    marginBottom: 16,
  },
  fieldTextArea: { height: 80, textAlignVertical: 'top' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.button, color: colors.textSecondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary, alignItems: 'center',
    ...shadows.sm,
  },
  saveBtnText: { ...typography.button, color: '#fff' },
});
