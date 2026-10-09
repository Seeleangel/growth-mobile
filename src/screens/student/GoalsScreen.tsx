import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { colors, gradients, borderRadius as br, shadows, typography, spacing as sp, layout } from '../../utils/theme';
import { theme } from '../../utils/theme';
import { GoalsSkeleton, EmptyState } from '../../components/common';
import { Goal, Obstacle } from '../../api/types';
import { OBSTACLE_TYPES, OBSTACLE_STATUSES } from '../../utils/constants';

type ViewType = 'goals' | 'obstacles';
type ObstacleModalMode = 'create' | 'edit' | null;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  in_progress: { label: '进行中', color: '#10B981', bg: '#DCFCE7', icon: 'play' },
  paused:      { label: '已暂停', color: '#F59E0B', bg: '#FEF3C7', icon: 'pause' },
  completed:   { label: '已完成', color: '#64748B', bg: '#F1F5F9', icon: 'checkmark' },
};

function getDaysLeft(targetDate: string): number {
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function GoalsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewType, setViewType] = useState<ViewType>('goals');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showObstacleModal, setShowObstacleModal] = useState(false);

  const [obstacleModalMode, setObstacleModalMode] = useState<ObstacleModalMode>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [obstacleContent, setObstacleContent] = useState('');
  const [obstacleType, setObstacleType] = useState('academic');
  const [obstacleSeverity, setObstacleSeverity] = useState(3);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['obstacles', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['aiSuggestion', user?.id] }),
    ]);
    setRefreshing(false);
  }, [user?.id, queryClient]);

  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ['goals', user?.id],
    queryFn: () => apiService.getGoals(user!.id),
    enabled: !!user?.id && viewType === 'goals',
  });

  const { data: obstacles, isLoading: obstaclesLoading } = useQuery<Obstacle[]>({
    queryKey: ['obstacles', user?.id],
    queryFn: () => apiService.getObstacles(user!.id),
    enabled: !!user?.id && viewType === 'obstacles',
  });

  const { data: aiSuggestion, isLoading: aiLoading } = useQuery({
    queryKey: ['aiSuggestion', user?.id, user?.dream],
    queryFn: () => apiService.getAISuggestions(user!.id, user?.dream),
    enabled: !!user?.id,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; target_date?: string }) =>
      apiService.createGoal(user!.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }); closeGoalModal(); },
    onError: (e: any) => Alert.alert('创建失败', e.message),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateGoal(user!.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }); closeGoalModal(); },
    onError: (e: any) => Alert.alert('更新失败', e.message),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiService.deleteGoal(user!.id, goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
    onError: (e: any) => Alert.alert('删除失败', e.message),
  });

  const createObstacleMutation = useMutation({
    mutationFn: (data: { content: string; obstacle_type: string; severity: number }) =>
      apiService.createObstacle(user!.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['obstacles', user?.id] }); closeObstacleModal(); },
    onError: (e: any) => Alert.alert('创建失败', e.message),
  });

  const updateObstacleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateObstacle(user!.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['obstacles', user?.id] }); closeObstacleModal(); },
    onError: (e: any) => Alert.alert('更新失败', e.message),
  });

  const deleteObstacleMutation = useMutation({
    mutationFn: (obstacleId: string) => apiService.deleteObstacle(user!.id, obstacleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obstacles', user?.id] }),
    onError: (e: any) => Alert.alert('删除失败', e.message),
  });

  const createObstacleTaskMutation = useMutation({
    mutationFn: (obstacleId: string) => apiService.createObstacleTask(user!.id, obstacleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obstacles', user?.id] });
      Alert.alert('已生成', '任务已添加到今日计划 🎯');
    },
    onError: (e: any) => Alert.alert('生成失败', e.message),
  });

  const openGoalModal = (goal?: Goal) => {
    if (goal) {
      setSelectedGoal(goal); setGoalTitle(goal.title);
      setGoalDesc(goal.description || ''); setGoalDate(goal.target_date || '');
    } else {
      setSelectedGoal(null); setGoalTitle(''); setGoalDesc(''); setGoalDate('');
    }
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false); setSelectedGoal(null);
    setGoalTitle(''); setGoalDesc(''); setGoalDate('');
  };

  const saveGoal = () => {
    if (!goalTitle.trim()) { Alert.alert('提示', '请输入目标标题'); return; }
    if (selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data: { title: goalTitle.trim(), description: goalDesc.trim() || undefined, target_date: goalDate || undefined } });
    } else {
      createGoalMutation.mutate({ title: goalTitle.trim(), description: goalDesc.trim() || undefined, target_date: goalDate || undefined });
    }
  };

  const toggleGoalStatus = (goal: Goal) => {
    const newStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    updateGoalMutation.mutate({ id: goal.id, data: { status: newStatus } });
  };

  const openObstacleModal = (obstacle?: Obstacle, mode: ObstacleModalMode = 'create') => {
    setObstacleModalMode(mode);
    if (obstacle) {
      setSelectedObstacle(obstacle); setObstacleContent(obstacle.content);
      setObstacleType(obstacle.obstacle_type); setObstacleSeverity(obstacle.severity);
    } else {
      setSelectedObstacle(null); setObstacleContent(''); setObstacleType('academic'); setObstacleSeverity(3);
    }
    setShowObstacleModal(true);
  };

  const closeObstacleModal = () => {
    setShowObstacleModal(false); setObstacleModalMode(null); setSelectedObstacle(null);
    setObstacleContent(''); setObstacleType('academic'); setObstacleSeverity(3);
  };

  const saveObstacle = () => {
    if (!obstacleContent.trim()) { Alert.alert('提示', '请输入阻碍内容'); return; }
    if (selectedObstacle && obstacleModalMode === 'edit') {
      updateObstacleMutation.mutate({ id: selectedObstacle.id, data: { content: obstacleContent.trim(), obstacle_type: obstacleType, severity: obstacleSeverity } });
    } else {
      createObstacleMutation.mutate({ content: obstacleContent.trim(), obstacle_type: obstacleType, severity: obstacleSeverity });
    }
  };


  const renderGoalItem = ({ item, index }: { item: Goal; index: number }) => {
    const status = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.in_progress;
    const progress = Math.min(100, Math.max(0, item.progress || 0));
    const isCompleted = item.status === 'completed';

    const handleDelete = () => Alert.alert('删除目标', `确定删除「${item.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteGoalMutation.mutate(item.id) },
    ]);

    return (
      <Animated.View entering={FadeInDown.delay(100 * index).springify()} style={gs.cardWrap}>
        <View style={gs.card}>
          {/* Header row */}
          <View style={gs.cardHeader}>
            <View style={[gs.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[gs.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {item.target_date ? (
                <View style={gs.streakBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textLight} />
                  <Text style={gs.streakText}>{getDaysLeft(item.target_date)} 天</Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={17} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tappable body → open edit modal */}
          <TouchableOpacity onPress={() => openGoalModal(item)} activeOpacity={0.85}>
            <Text style={gs.cardTitle}>{item.title}</Text>
            <Text style={gs.cardDesc} numberOfLines={2}>{item.description || '暂无描述'}</Text>
            {item.target_date && (
              <View style={gs.dateRow}>
                <Ionicons name="time-outline" size={13} color={colors.textLight} />
                <Text style={gs.dateText}>截止: {new Date(item.target_date).toLocaleDateString()}</Text>
              </View>
            )}
            <View style={gs.progressBarBg}>
              <View style={[gs.progressBarFill, { width: `${progress}%`, backgroundColor: status.color }]} />
            </View>
          </TouchableOpacity>

          {/* Action row */}
          <View style={gs.cardActionRow}>
            <TouchableOpacity
              style={[gs.actionBtn, isCompleted ? gs.actionBtnAlt : gs.actionBtnPrimary]}
              onPress={() => toggleGoalStatus(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isCompleted ? 'refresh-outline' : 'checkmark-circle-outline'}
                size={14}
                color={isCompleted ? colors.textSecondary : '#fff'}
              />
              <Text style={[gs.actionBtnText, isCompleted ? gs.actionBtnTextAlt : gs.actionBtnTextPrimary]}>
                {isCompleted ? '重新激活' : '标记完成'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderObstacleItem = ({ item, index }: { item: Obstacle; index: number }) => {
    const statusCfg = OBSTACLE_STATUSES.find(s => s.id === item.status) || OBSTACLE_STATUSES[0];
    const typeLabel = OBSTACLE_TYPES.find(t => t.id === item.obstacle_type)?.label || item.obstacle_type;

    const handleDelete = () => Alert.alert('删除阻碍', `确定删除这条记录吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteObstacleMutation.mutate(item.id) },
    ]);

    const cycleStatus = () => {
      const order: Obstacle['status'][] = ['todo', 'in_progress', 'resolved'];
      const next = order[(order.indexOf(item.status) + 1) % order.length];
      updateObstacleMutation.mutate({ id: item.id, data: { status: next } });
    };

    const hasTask = !!item.linked_task_id;

    return (
      <Animated.View entering={FadeInDown.delay(100 * (index || 0)).springify()} style={gs.cardWrap}>
        <View style={gs.card}>
          {/* Header row */}
          <View style={gs.cardHeader}>
            <View style={[gs.statusBadge, { backgroundColor: `${statusCfg.color}20` }]}>
              <View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusCfg.color }]} />
              <Text style={[gs.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[gs.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alert-outline" size={12} color="#F59E0B" />
                <Text style={[gs.statusText, { color: '#F59E0B' }]}>Lv.{item.severity} · {typeLabel}</Text>
              </View>
              <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={17} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tappable body → open edit modal */}
          <TouchableOpacity onPress={() => openObstacleModal(item, 'edit')} activeOpacity={0.85}>
            <Text style={gs.cardTitle}>{item.content}</Text>
          </TouchableOpacity>

          {/* Action row */}
          <View style={gs.cardActionRow}>
            {/* Status cycle button */}
            <TouchableOpacity
              style={[gs.actionBtn, gs.actionBtnAlt, { flex: 1 }]}
              onPress={cycleStatus}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal-outline" size={13} color={colors.textSecondary} />
              <Text style={[gs.actionBtnText, gs.actionBtnTextAlt]}>
                {item.status === 'todo' ? '→ 处理中' : item.status === 'in_progress' ? '→ 已解决' : '→ 重新待处理'}
              </Text>
            </TouchableOpacity>

            {/* Generate task button */}
            {!hasTask && (
              <TouchableOpacity
                style={[gs.actionBtn, gs.actionBtnPrimary, { flex: 1 }]}
                onPress={() => createObstacleTaskMutation.mutate(item.id)}
                activeOpacity={0.8}
                disabled={createObstacleTaskMutation.isPending}
              >
                <Ionicons name="add-circle-outline" size={13} color="#fff" />
                <Text style={[gs.actionBtnText, gs.actionBtnTextPrimary]}>生成任务</Text>
              </TouchableOpacity>
            )}
            {hasTask && (
              <View style={[gs.actionBtn, { flex: 1, backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={[gs.actionBtnText, { color: '#10B981' }]}>已有任务</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Loading skeleton
  const isListLoading = viewType === 'goals' ? goalsLoading : obstaclesLoading;
  if (isListLoading && !(viewType === 'goals' ? goals : obstacles)) {
    return <GoalsSkeleton />;
  }

  return (
    <SafeAreaView style={gs.container}>
      {/* Gradient Header */}
      <LinearGradient colors={gradients.primaryHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={gs.heroHeader}>
        <Animated.Text entering={FadeInDown.delay(100).springify()} style={gs.heroTitle}>期待与目标</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(200).springify()} style={gs.heroSubtitle}>{user?.dream ? `我的期待：${user.dream}` : '写下一个期待，让AI陪你一步步靠近'}</Animated.Text>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={gs.tabContainer}>
        <TouchableOpacity style={[gs.tabButton, viewType === 'goals' && gs.activeTab]} onPress={() => setViewType('goals')}>
          <Ionicons name="trophy" size={16} color={viewType === 'goals' ? '#fff' : colors.textSecondary} />
          <Text style={[gs.tabText, viewType === 'goals' && gs.activeTabText]}>我的目标</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[gs.tabButton, viewType === 'obstacles' && gs.activeTab]} onPress={() => setViewType('obstacles')}>
          <Ionicons name="alert-circle" size={16} color={viewType === 'obstacles' ? '#fff' : colors.textSecondary} />
          <Text style={[gs.tabText, viewType === 'obstacles' && gs.activeTabText]}>面对阻碍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={gs.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* AI Suggestion Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={gs.aiCardWrap}>
          <LinearGradient colors={[colors.aiAccentLight, colors.aiAccentMuted]} style={gs.aiCardGrad}>
            <View style={gs.aiHeader}>
              <Ionicons name="sparkles" size={18} color={colors.aiAccent} />
              <Text style={gs.aiTitle}>{aiSuggestion?.title || 'AI小建议'}</Text>
            </View>
            {aiLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.aiAccent} />
                <Text style={{ marginTop: 8, color: colors.aiAccent, ...typography.caption }}>AI思考中...</Text>
              </View>
            ) : (
              <View style={gs.aiTips}>
                {(aiSuggestion?.tips || []).map((tip: string, idx: number) => (
                  <View key={idx} style={gs.aiTipRow}>
                    <View style={gs.aiTipDot} />
                    <Text style={gs.aiTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {viewType === 'goals' ? (
          (goals || []).length === 0 ? (
            <EmptyState
              icon="🎯"
              title="还没有目标"
              message="设定一个目标，让成长有方向"
            />
          ) : [...(goals || [])]
            .sort((a, b) => {
              // Status priority: active/in_progress before completed
              const statusOrder: Record<string, number> = { active: 0, in_progress: 0, completed: 1 };
              const aPri = statusOrder[a.status] ?? 0;
              const bPri = statusOrder[b.status] ?? 0;
              if (aPri !== bPri) return aPri - bPri;
              // Completed: most recently completed first
              if (a.status === 'completed' && b.status === 'completed') {
                return (b.completed_at || '').localeCompare(a.completed_at || '');
              }
              // Active/In-progress: by target_date ascending (most urgent first)
              const aDate = a.target_date || '9999';
              const bDate = b.target_date || '9999';
              return aDate.localeCompare(bDate);
            })
            .map((item, index) => (
              <React.Fragment key={item.id}>
                {renderGoalItem({ item, index })}
              </React.Fragment>
            ))
        ) : (
          (obstacles || []).length === 0 ? (
            <EmptyState
              icon="💪"
              title="还没有记录阻碍"
              message="记录遇到的困难，AI帮你想办法"
            />
          ) : [...(obstacles || [])]
            .sort((a, b) => {
              // Status priority: todo/in_progress before resolved
              const statusOrder: Record<string, number> = { todo: 0, in_progress: 0, resolved: 1 };
              const aPri = statusOrder[a.status] ?? 0;
              const bPri = statusOrder[b.status] ?? 0;
              if (aPri !== bPri) return aPri - bPri;
              // Same status: higher severity first
              return (b.severity || 0) - (a.severity || 0);
            })
            .map((item, index) => renderObstacleItem({ item, index }))
        )}
        <View style={{ height: layout.tabBarHeight + sp['3xl'] }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={gs.fab} onPress={() => viewType === 'goals' ? openGoalModal() : openObstacleModal()} activeOpacity={0.85}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={gs.fabGrad}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={gs.fabText}>新{viewType === 'goals' ? '目标' : '阻碍'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Goal Modal */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <View style={gs.modalOverlay}>
          <View style={gs.modalContent}>
            <View style={gs.modalHandle} />
            <Text style={gs.modalTitle}>{selectedGoal ? '编辑目标' : '新建目标'}</Text>
            <TextInput style={gs.input} placeholder="目标标题" placeholderTextColor={colors.textLight} value={goalTitle} onChangeText={setGoalTitle} />
            <TextInput style={[gs.input, { height: 100, textAlignVertical: 'top' }]} placeholder="描述（可选）" placeholderTextColor={colors.textLight} value={goalDesc} onChangeText={setGoalDesc} multiline />
            <View style={gs.modalButtons}>
              <TouchableOpacity style={[gs.modalBtn, gs.cancelBtn]} onPress={closeGoalModal}><Text style={gs.cancelBtnText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={[gs.modalBtn, gs.confirmBtn]} onPress={saveGoal}><Text style={gs.confirmBtnText}>保存</Text></TouchableOpacity>
            </View>
            {selectedGoal && (
              <TouchableOpacity
                style={gs.deleteBtn}
                onPress={() => {
                  Alert.alert('删除目标', `确定删除「${selectedGoal.title}」吗？`, [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => { deleteGoalMutation.mutate(selectedGoal.id); closeGoalModal(); } },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={15} color={colors.error} />
                <Text style={gs.deleteBtnText}>删除目标</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Obstacle Modal */}
      <Modal visible={showObstacleModal} animationType="slide" transparent>
        <View style={gs.modalOverlay}>
          <View style={gs.modalContent}>
            <View style={gs.modalHandle} />
            <Text style={gs.modalTitle}>记录阻碍</Text>
            <TextInput style={gs.input} placeholder="描述你遇到的阻碍" placeholderTextColor={colors.textLight} value={obstacleContent} onChangeText={setObstacleContent} multiline />
            <Text style={gs.modalLabel}>类型</Text>
            <View style={gs.typeSelector}>
              {OBSTACLE_TYPES.map(type => (
                <TouchableOpacity key={type.id} style={[gs.typeChip, obstacleType === type.id && gs.typeChipActive]} onPress={() => setObstacleType(type.id)}>
                  <Text style={[gs.typeChipText, obstacleType === type.id && gs.typeChipTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={gs.modalLabel}>严重程度</Text>
            <View style={gs.severityRow}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity key={level} onPress={() => setObstacleSeverity(level)}>
                  <Ionicons name={obstacleSeverity >= level ? 'star' : 'star-outline'} size={30} color={obstacleSeverity >= level ? '#F59E0B' : colors.border} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={gs.modalButtons}>
              <TouchableOpacity style={[gs.modalBtn, gs.cancelBtn]} onPress={closeObstacleModal}><Text style={gs.cancelBtnText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={[gs.modalBtn, gs.confirmBtn]} onPress={saveObstacle}><Text style={gs.confirmBtnText}>保存</Text></TouchableOpacity>
            </View>
            {selectedObstacle && obstacleModalMode === 'edit' && (
              <TouchableOpacity
                style={gs.deleteBtn}
                onPress={() => {
                  Alert.alert('删除阻碍', '确定删除这条阻碍记录吗？', [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => { deleteObstacleMutation.mutate(selectedObstacle.id); closeObstacleModal(); } },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={15} color={colors.error} />
                <Text style={gs.deleteBtnText}>删除阻碍</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const gs = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroHeader: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: sp.lg, borderBottomLeftRadius: br.xxl, borderBottomRightRadius: br.xxl },
  heroTitle: { ...typography.h1, color: '#fff', textAlign: 'center' },
  heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },

  tabContainer: {
    flexDirection: 'row', marginHorizontal: sp.lg, marginTop: -16, marginBottom: sp.md,
    backgroundColor: '#fff', borderRadius: br.full, padding: 4, ...shadows.sm,
  },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: br.full, gap: 6 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  activeTabText: { color: '#fff' },

  scrollContent: { paddingHorizontal: sp.lg, paddingTop: sp.md, paddingBottom: 120 },

  aiCardWrap: { marginBottom: sp.lg, borderRadius: br.xl, overflow: 'hidden', ...shadows.sm },
  aiCardGrad: { padding: sp.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiTitle: { ...typography.h4, color: colors.aiAccent },
  aiTips: { gap: 8 },
  aiTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  aiTipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.aiAccent, marginTop: 6 },
  aiTipText: { flex: 1, ...typography.caption, color: colors.aiAccent, lineHeight: 18 },

  cardWrap: { marginBottom: sp.md },
  card: {
    backgroundColor: '#fff', borderRadius: br.xl, padding: sp.md,
    ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: br.full },
  statusText: { ...typography.caption, fontWeight: '700' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { ...typography.caption, fontWeight: '600', color: '#F97316' },
  cardTitle: { ...typography.h4, color: colors.text, marginBottom: 4 },
  cardDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: sp.sm },
  cardFooter: { gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { ...typography.caption, color: colors.textLight },
  progressBarBg: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  fab: { position: 'absolute', right: 20, bottom: 100 },
  fabGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: br.full,
    ...shadows.glow,
  },
  fabText: { ...typography.buttonSm, color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: br.xxl, borderTopRightRadius: br.xxl, padding: sp.lg, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: sp.lg },
  modalTitle: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: sp.lg },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: br.lg, padding: 14, marginBottom: sp.md,
    ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.borderLight,
  },
  modalLabel: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: sp.md },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: br.full, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surfaceAlt },
  typeChipActive: { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
  typeChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.primaryDark },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: sp.xl, justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: br.lg, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.surfaceAlt },
  confirmBtn: { backgroundColor: colors.primary },
  cancelBtnText: { ...typography.buttonSm, color: colors.textSecondary },
  confirmBtnText: { ...typography.buttonSm, color: '#fff' },

  cardActionRow: { flexDirection: 'row', gap: 8, marginTop: sp.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: br.full, justifyContent: 'center' },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnAlt: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderLight },
  actionBtnText: { ...typography.caption, fontWeight: '700' },
  actionBtnTextPrimary: { color: '#fff' },
  actionBtnTextAlt: { color: colors.textSecondary },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: sp.sm },
  deleteBtnText: { ...typography.caption, fontWeight: '700', color: colors.error },
});
