import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import {
  colors, gradients, shadows, borderRadius, spacing as sp,
  typography, glass, motion, layout,
} from '../../utils/theme';
import { theme } from '../../utils/theme';
import { Card, LoadingSpinner, EmptyState, DashboardSkeleton } from '../../components/common';
import { StudentStats, StudentTask, Task } from '../../api/types';
import { MOOD_OPTIONS } from '../../utils/constants';
import apiClient from '../../api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function StudentDashboardScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFallbackReached, setLoadingFallbackReached] = useState(false);
  const [apiReachable, setApiReachable] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // Evidence modal state
  const [evidenceModal, setEvidenceModal] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [evidenceMime, setEvidenceMime] = useState('image/jpeg');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  useEffect(() => {
    let mounted = true;
    const probeApi = async () => {
      try {
        await apiClient.get('/api/health', { timeout: 5000 });
        if (mounted) setApiReachable(true);
      } catch {
        if (mounted) setApiReachable(false);
      }
    };
    probeApi();
    return () => { mounted = false; };
  }, []);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<StudentStats>({
    queryKey: ['studentStats', user?.id],
    queryFn: () => apiService.getStudentStats(user!.id),
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ['tasks', user?.id],
    queryFn: () => apiService.getTasks(user?.id),
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: studentTasks } = useQuery<StudentTask[]>({
    queryKey: ['studentTasks', user?.id],
    queryFn: () => apiService.getStudentTasks(user!.id),
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: aiTaskSuggestions, isLoading: aiTasksLoading } = useQuery({
    queryKey: ['aiTaskSuggestions', user?.id],
    queryFn: () => apiService.getAiTaskSuggestions(user!.id),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 60 * 1000, // 3h
  });

  useEffect(() => {
    console.log('[Dashboard] user:', user?.id || 'null', 'stats:', !!stats, 'tasks:', tasks?.length ?? 'null');
  }, [user, stats, tasks]);

  useEffect(() => {
    if (!statsLoading) { setLoadingFallbackReached(false); return; }
    const timer = setTimeout(() => setLoadingFallbackReached(true), 12000);
    return () => clearTimeout(timer);
  }, [statsLoading]);

  const checkinMutation = useMutation({
    mutationFn: () => apiService.submitCheckin(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
      Alert.alert('签到成功', '🎉 今日签到完成！');
    },
    onError: (error: any) => Alert.alert('签到失败', error.message || '请稍后重试'),
  });

  const moodMutation = useMutation({
    mutationFn: (mood: string) => apiService.submitMood({ student_id: user!.id, mood }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] }),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiService.completeTask(user!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
    },
  });

  // Open evidence picker → on pick, open evidence modal
  const handleTaskPressForComplete = (taskId: string, taskTitle: string) => {
    setEvidenceUri(null);
    setEvidenceModal({ taskId, taskTitle });
  };

  const pickEvidenceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const camStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus.status !== 'granted') {
        Alert.alert('权限不足', '需要相册或摄像头权限才能上传图片');
        return;
      }
    }
    Alert.alert('选择凭证图片', '', [
      {
        text: '拍照', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) {
            setEvidenceUri(result.assets[0].uri);
            setEvidenceMime(result.assets[0].mimeType || 'image/jpeg');
          }
        }
      },
      {
        text: '从相册选择', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) {
            setEvidenceUri(result.assets[0].uri);
            setEvidenceMime(result.assets[0].mimeType || 'image/jpeg');
          }
        }
      },
      { text: '取消', style: 'cancel' }
    ]);
  };

  const submitEvidence = async () => {
    if (!evidenceModal) return;
    if (!evidenceUri) {
      Alert.alert('请先选择图片', '需要拍一张完成凭证哦！');
      return;
    }
    setSubmittingEvidence(true);
    try {
      // Convert URI to base64
      const resp = await fetch(evidenceUri);
      const blob = await resp.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      await apiService.completeTaskWithEvidence(user!.id, evidenceModal.taskId, base64, evidenceMime);
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
      setEvidenceModal(null);
      setEvidenceUri(null);
      Alert.alert('完成！', '任务已完成，图片已上传 🎉');
    } catch (e: any) {
      Alert.alert('提交失败', e.message || '请重试');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const addTaskMutation = useMutation({
    mutationFn: (title: string) => apiService.createTodayPlan(user!.id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      setNewTaskTitle('');
      setShowAddTask(false);
    },
    onError: (e: any) => Alert.alert('添加失败', e.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiService.deleteTask(user!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
    onError: (e: any) => Alert.alert('删除失败', e.message),
  });

  const reopenTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiService.reopenTask(user!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
    },
    onError: (e: any) => Alert.alert('操作失败', e.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
    setRefreshing(false);
  }, [user?.id, queryClient]);

  const handleCheckin = () => {
    if (stats?.checked_in_today) {
      Alert.alert('提示', '今天已经签到了！继续加油吧 💪');
      return;
    }
    checkinMutation.mutate();
  };

  // ── Build today's task list from student_tasks (assigned/planned) ───
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const taskMap = new Map((tasks || []).map(t => [t.id, t]));

  const completedTaskIds = new Set(
    (studentTasks || []).filter(t => t.status === 'completed').map(t => t.task_id)
  );

  // Only show tasks created or completed today
  const todayStudentTasks = (studentTasks || []).filter(st => {
    const createdDay = st.created_at?.slice(0, 10);
    const completedDay = st.completed_at?.slice(0, 10);
    return createdDay === todayStr || completedDay === todayStr;
  });

  // Join with task details, smart sort: pending first → completed last
  const todayTasks = todayStudentTasks
    .map(st => {
      const task = taskMap.get(st.task_id);
      return task ? { ...task, _studentTaskId: st.id, _completedAt: st.completed_at } : null;
    })
    .filter((t): t is Task & { _studentTaskId: string; _completedAt?: string } => t !== null && t.type !== 'challenge')
    .sort((a, b) => {
      const aCompleted = completedTaskIds.has(a.id);
      const bCompleted = completedTaskIds.has(b.id);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      if (aCompleted && bCompleted) {
        return (b._completedAt || '').localeCompare(a._completedAt || '');
      }
      return (b.created_at || '').localeCompare(a.created_at || '');
    })
    .slice(0, 10);

  const todayHighlight = computeHighlight(stats, todayTasks, completedTaskIds);

  // ── Loading / Error States ──────────────────────────────────────────
  if (statsLoading && !stats && !loadingFallbackReached) {
    return <DashboardSkeleton />;
  }

  if (!apiReachable) {
    return (
      <View style={s.errorWrap}>
        <View style={s.errorIcon}><Ionicons name="cloud-offline-outline" size={36} color={colors.warning} /></View>
        <Text style={s.errorTitle}>无法连接到数据服务</Text>
        <Text style={s.errorDesc}>请确认后端服务已启动</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRefresh}>
          <Text style={s.retryBtnText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <View style={s.errorWrap}>
        <Ionicons name="person-outline" size={36} color={colors.textTertiary} />
        <Text style={s.errorTitle}>未登录</Text>
        <Text style={s.errorDesc}>请先登录账号</Text>
      </View>
    );
  }

  if (statsError && !stats) {
    return (
      <View style={s.errorWrap}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
        <Text style={s.errorTitle}>数据加载失败</Text>
        <Text style={s.errorDesc}>{(statsError as Error).message || '请检查网络连接'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRefresh}>
          <Text style={s.retryBtnText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const xpProgress = stats?.level ? stats.level.progress : 0;

  // ── Main UI ─────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ═══ HERO HEADER ═══ */}
        <Animated.View entering={FadeIn.duration(500)}>
          <LinearGradient
            colors={gradients.primaryHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGradient}
          >
            {/* Decorative circles */}
            <View style={[s.heroBubble, { top: -30, right: -20, width: 120, height: 120, opacity: 0.12 }]} />
            <View style={[s.heroBubble, { bottom: -10, left: 20, width: 80, height: 80, opacity: 0.08 }]} />

            <View style={s.heroContent}>
              <View style={s.heroTopRow}>
                <View>
                  <Text style={s.heroGreeting}>你好，{user?.full_name || '同学'} 👋</Text>
                  <Text style={s.heroDate}>
                    {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.checkinPill, stats?.checked_in_today && s.checkinPillDone]}
                  onPress={handleCheckin}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={stats?.checked_in_today ? 'checkmark-circle' : 'sunny-outline'}
                    size={18}
                    color="#fff"
                  />
                  <View>
                    <Text style={s.checkinPillText}>
                      {stats?.checked_in_today ? '已签到' : '签到'}
                    </Text>
                    {stats?.checked_in_today && (stats?.streak ?? 0) > 0 && (
                      <Text style={s.checkinStreakText}>🔥 {stats!.streak}天连续</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* XP Progress inline */}
              {stats?.level && (
                <View style={s.heroXpRow}>
                  <Text style={s.heroLevel}>Lv.{stats.level.level}</Text>
                  <View style={s.heroProgressTrack}>
                    <View style={[s.heroProgressFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
                  </View>
                  <Text style={s.heroXpText}>{stats.level.current_xp}/{stats.level.xp_needed}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ═══ TODAY HIGHLIGHT CARD ═══ */}
        <TodayHighlightCard highlight={todayHighlight} />

        {/* ═══ MOOD SECTION ═══ */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>此刻更像哪种情绪？</Text>
            <View style={s.moodRow}>
              {MOOD_OPTIONS.map((mood, idx) => (
                <MoodBubble
                  key={mood.id}
                  emoji={mood.emoji}
                  label={mood.label}
                  delay={idx * 40}
                  onPress={() => moodMutation.mutate(mood.id)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ═══ TODAY'S TASKS ═══ */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <View style={s.sectionIconWrap}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <Text style={s.sectionTitle}>今日任务</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{todayTasks.length}</Text>
              </View>
              <TouchableOpacity
                style={s.addTaskBtn}
                onPress={() => setShowAddTask(v => !v)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name={showAddTask ? 'close-outline' : 'add-circle-outline'} size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Add task input */}
            {showAddTask && (
              <Animated.View entering={FadeInDown.duration(200)} style={s.addTaskRow}>
                <TextInput
                  style={s.addTaskInput}
                  placeholder="输入任务标题…"
                  placeholderTextColor={colors.textLight}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (newTaskTitle.trim()) addTaskMutation.mutate(newTaskTitle.trim());
                  }}
                />
                <TouchableOpacity
                  style={[s.addTaskConfirmBtn, !newTaskTitle.trim() && { opacity: 0.4 }]}
                  onPress={() => { if (newTaskTitle.trim()) addTaskMutation.mutate(newTaskTitle.trim()); }}
                  disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {tasksLoading ? (
              <LoadingSpinner message="加载任务中..." />
            ) : todayTasks.length === 0 && !showAddTask ? (
              <TouchableOpacity onPress={() => setShowAddTask(true)} activeOpacity={0.8}>
                <EmptyState
                  icon="noTasks"
                  title="暂无任务"
                  message="点击右上角 + 添加今日任务 🎯"
                />
              </TouchableOpacity>
            ) : (
              todayTasks.map((task, idx) => {
                const isCompleted = completedTaskIds.has(task.id);
                return (
                  <Animated.View key={task.id} entering={FadeInDown.delay(400 + idx * 60).springify()}>
                    <TouchableOpacity
                      style={[s.taskRow, isCompleted && s.taskRowDone]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!isCompleted) {
                          handleTaskPressForComplete(task._studentTaskId, task.title);
                        }
                        // completed rows: tap does nothing — use the refresh btn on the right
                      }}
                      onLongPress={() => {
                        Alert.alert('删除任务', `确定删除「${task.title}」吗？`, [
                          { text: '取消', style: 'cancel' },
                          { text: '删除', style: 'destructive', onPress: () => deleteTaskMutation.mutate(task._studentTaskId) },
                        ]);
                      }}
                    >
                      <View style={[s.taskCheck, isCompleted && s.taskCheckDone]}>
                        {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <View style={s.taskBody}>
                        <Text style={[s.taskTitle, isCompleted && s.taskTitleDone]}>{task.title}</Text>
                        {task.description && (
                          <Text style={s.taskDesc} numberOfLines={1}>{task.description}</Text>
                        )}
                      </View>
                      {/* Right action button — independent tap target */}
                      {isCompleted ? (
                        <TouchableOpacity
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          activeOpacity={0.6}
                          onPress={() => reopenTaskMutation.mutate(task._studentTaskId)}
                        >
                          <View style={s.reopenBtn}>
                            <Ionicons name="refresh-outline" size={15} color={colors.primary} />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="camera-outline" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* ═══ AI TASK SUGGESTIONS ═══ */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <View style={[s.sectionIconWrap, { backgroundColor: colors.aiAccentLight }]}>
                <Ionicons name="sparkles" size={18} color={colors.aiAccent} />
              </View>
              <Text style={s.sectionTitle}>AI推荐小任务</Text>
              {aiTaskSuggestions?.dream && (
                <Text style={s.aiDreamTag} numberOfLines={1}>围绕「{aiTaskSuggestions.dream}」</Text>
              )}
            </View>
            {aiTasksLoading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.aiAccent} />
                <Text style={{ marginTop: 8, color: colors.aiAccent, ...typography.caption }}>AI思考中…</Text>
              </View>
            ) : (aiTaskSuggestions?.tasks || []).map((task, idx) => (
              <Animated.View key={idx} entering={FadeInDown.delay(550 + idx * 60).springify()}>
                <View style={s.aiTaskRow}>
                  <View style={s.aiTaskIndex}>
                    <Text style={s.aiTaskIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={[s.taskBody, { flex: 1 }]}>
                    <Text style={s.aiTaskTitle}>{task.title}</Text>
                    <Text style={s.aiTaskDesc} numberOfLines={2}>{task.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.aiAddBtn}
                    activeOpacity={0.7}
                    disabled={addTaskMutation.isPending}
                    onPress={() => addTaskMutation.mutate(task.title)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacer for floating tab bar */}
        <View style={{ height: layout.tabBarHeight + sp['3xl'] }} />
      </ScrollView>

      {/* ═══ EVIDENCE MODAL ═══ */}
      <Modal visible={!!evidenceModal} animationType="slide" transparent>
        <View style={s.evidenceOverlay}>
          <View style={s.evidenceSheet}>
            <View style={s.modalHandle} />
            <Text style={s.evidenceTitle}>上传完成凭证 📸</Text>
            <Text style={s.evidenceSubtitle}>
              {evidenceModal?.taskTitle || '任务'}
            </Text>
            <Text style={s.evidenceHint}>拍一张照片作为完成的证明，让爸爸妈妈或老师看到你的成果！</Text>

            {/* Image preview */}
            <TouchableOpacity style={s.evidencePickArea} onPress={pickEvidenceImage} activeOpacity={0.8}>
              {evidenceUri ? (
                <Image source={{ uri: evidenceUri }} style={s.evidencePreview} resizeMode="cover" />
              ) : (
                <View style={s.evidencePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={colors.textLight} />
                  <Text style={s.evidencePlaceholderText}>点击拍照或从相册选择</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={s.evidenceBtnRow}>
              <TouchableOpacity
                style={[s.evidenceBtn, s.evidenceBtnCancel]}
                onPress={() => { setEvidenceModal(null); setEvidenceUri(null); }}
              >
                <Text style={s.evidenceBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.evidenceBtn, s.evidenceBtnConfirm, !evidenceUri && { opacity: 0.45 }]}
                onPress={submitEvidence}
                disabled={submittingEvidence || !evidenceUri}
              >
                {submittingEvidence
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.evidenceBtnConfirmText}>提交完成 ✅</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Highlight logic (pure, no API) ────────────────────────────────────────
const MILESTONE_STREAKS = [3, 7, 14, 21, 30, 60, 100];
const DAILY_QUOTES = [
  '每一步都算数，继续向前走 🌱',
  '坚持就是胜利，你做到了 ✨',
  '今天的努力是明天的礼物 🎁',
  '相信自己，你比想象中更厉害 💪',
  '好奇心是最好的老师 🔍',
  '勇敢尝试，才能不断成长 🚀',
  '一点一滴的积累，成就不凡的你 🌟',
  '专注当下，把今天做好 🎯',
  '困难是成长的阶梯 🪜',
  '不是因为有希望才坚持，而是因为坚持才有希望 🌈',
  '你的潜力远超你的想象 🦋',
  '每次努力都在悄悄改变你 🌊',
  '热爱让平凡变得非凡 ❤️',
  '慢慢来，比较快 🐢',
  '今天比昨天进步一点点，就够了 📈',
  '做你自己，这已经很了不起 ⭐',
  '把快乐带给身边的人 😊',
  '创造属于你自己的高光时刻 🏆',
  '知识是你永远带得走的财富 📚',
  '今日播下的种子，未来都会开花 🌸',
];

type HighlightInfo = { emoji: string; tag: string; title: string; subtitle: string; gradient: readonly string[]; dark: boolean };

function computeHighlight(
  stats: import('../../api/types').StudentStats | undefined,
  todayTasks: Array<{ title: string; type?: string; id: string }>,
  completedTaskIds: Set<string>,
): HighlightInfo {
  // 1. Today completed a challenge
  const completedChallenge = todayTasks.find(t => t.type === 'challenge' && completedTaskIds.has(t.id));
  if (completedChallenge) {
    return {
      emoji: '🏆', tag: '今日高光',
      title: '征服了今日挑战！',
      subtitle: completedChallenge.title,
      gradient: ['#F4B665', '#E07A5F'] as const,
      dark: false,
    };
  }
  // 2. Completed ≥1 regular task today
  const completedCount = todayTasks.filter(t => completedTaskIds.has(t.id)).length;
  if (completedCount > 0) {
    const lastDone = todayTasks.find(t => completedTaskIds.has(t.id));
    return {
      emoji: '✅', tag: '今日高光',
      title: `完成了 ${completedCount} 个任务！`,
      subtitle: lastDone?.title || '棒极了，继续加油！',
      gradient: ['#E29578', '#E07A5F'] as const,
      dark: false,
    };
  }
  // 3. Streak milestone
  const streak = stats?.streak ?? 0;
  if (streak > 0 && MILESTONE_STREAKS.includes(streak)) {
    return {
      emoji: '🔥', tag: '里程碑',
      title: `连续签到 ${streak} 天达成！`,
      subtitle: '坚持的力量正在悄悄改变你 💪',
      gradient: ['#C96248', '#E07A5F'] as const,
      dark: false,
    };
  }
  // 4. Checked in + has level
  if (stats?.checked_in_today && stats?.level) {
    return {
      emoji: '⭐', tag: '今日状态',
      title: `Lv.${stats.level.level} · 已签到`,
      subtitle: streak > 1 ? `已连续签到 ${streak} 天，继续出发！` : '今天已签到，继续加油！',
      gradient: ['#FFF5F2', '#FDE8E1'] as const,
      dark: true,
    };
  }
  // 5. Fallback: date-keyed daily quote
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  return {
    emoji: '💬', tag: '每日寄语',
    title: quote,
    subtitle: `${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`,
    gradient: ['#FFF5F2', '#FDE8E1'] as const,
    dark: true,
  };
}

function TodayHighlightCard({ highlight }: { highlight: HighlightInfo }) {
  const textColor = highlight.dark ? colors.text : '#fff';
  const subColor = highlight.dark ? colors.textSecondary : 'rgba(255,255,255,0.85)';
  const tagColor = highlight.dark ? colors.primary : 'rgba(255,255,255,0.7)';
  return (
    <Animated.View entering={FadeInDown.delay(120).springify()} style={s.highlightWrap}>
      <LinearGradient
        colors={highlight.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.highlightCard}
      >
        <View style={s.highlightLeft}>
          <View style={[s.highlightTagPill, { backgroundColor: highlight.dark ? colors.primaryMuted : 'rgba(255,255,255,0.25)' }]}>
            <Text style={[s.highlightTagText, { color: tagColor }]}>{highlight.tag} ✨</Text>
          </View>
          <Text style={[s.highlightTitle, { color: textColor }]} numberOfLines={2}>{highlight.title}</Text>
          <Text style={[s.highlightSubtitle, { color: subColor }]} numberOfLines={2}>{highlight.subtitle}</Text>
        </View>
        <Text style={s.highlightEmoji}>{highlight.emoji}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function MoodBubble({ emoji, label, delay, onPress }: {
  emoji: string; label: string; delay: number; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[s.moodBubble, animStyle]}
      activeOpacity={0.85}
      onPressIn={() => { scale.value = withSpring(0.88, motion.spring.press); }}
      onPressOut={() => { scale.value = withSpring(1, motion.spring.bouncy); }}
      onPress={onPress}
    >
      <View style={s.moodEmojiCircle}>
        <Text style={s.moodEmoji}>{emoji}</Text>
      </View>
      <Text style={s.moodLabel}>{label}</Text>
    </AnimatedTouchable>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Styles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Error states ──
  errorWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 10, backgroundColor: colors.background,
  },
  errorIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  errorTitle: { ...typography.h2, color: colors.text },
  errorDesc: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: borderRadius.full, backgroundColor: colors.primary,
  },
  retryBtnText: { ...typography.button, color: '#fff' },

  // ── Hero Header (Gradient) ──
  heroGradient: {
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 28,
    paddingHorizontal: layout.screenPadding,
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  heroContent: { gap: 16 },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  heroGreeting: {
    ...typography.h1, color: '#fff', fontWeight: '800',
  },
  heroDate: {
    ...typography.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: 2,
  },

  // ── Checkin Pill ──
  checkinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  checkinPillDone: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  checkinPillText: {
    ...typography.buttonSm, color: '#fff', fontWeight: '700',
  },
  checkinStreakText: {
    ...typography.caption, color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', marginTop: 1,
  },

  // ── Hero XP bar ──
  heroXpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  heroLevel: {
    ...typography.label, color: '#fff', fontWeight: '800', fontSize: 14,
  },
  heroProgressTrack: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%', borderRadius: 4,
    backgroundColor: '#fff',
  },
  heroXpText: {
    ...typography.caption, color: 'rgba(255,255,255,0.8)', fontSize: 11,
  },

  // ── Today Highlight Card ──
  highlightWrap: {
    marginHorizontal: layout.screenPadding,
    marginTop: -20, // overlap hero bottom
    marginBottom: 4,
    ...shadows.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: borderRadius.xl,
    minHeight: 104,
  },
  highlightLeft: {
    flex: 1,
    gap: 6,
    paddingRight: 12,
  },
  highlightTagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  highlightTagText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  highlightTitle: {
    ...typography.h3,
    fontWeight: '800',
    lineHeight: 24,
  },
  highlightSubtitle: {
    ...typography.bodySmall,
    fontWeight: '500',
    lineHeight: 18,
  },
  highlightEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },

  // ── Sections ──
  section: {
    marginHorizontal: layout.screenPadding,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: layout.cardPadding,
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3, color: colors.text, fontWeight: '700', flex: 1,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption, color: colors.primary, fontWeight: '700',
  },

  // ── Mood Bubbles ──
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    paddingVertical: 4,
  },
  moodBubble: { alignItems: 'center', gap: 6, width: '31%' },
  moodEmojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.borderLight,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Task Items ──
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  taskRowDone: { opacity: 0.45 },
  taskCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface,
  },
  taskCheckDone: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  taskBody: { flex: 1 },
  taskTitle: { ...typography.body, color: colors.text, fontWeight: '500' },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
  taskDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  reopenBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Add Task ──
  addTaskBtn: { marginLeft: 'auto' },
  addTaskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.lg,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  addTaskInput: {
    flex: 1, paddingVertical: 10,
    ...typography.body, color: colors.text,
  },
  addTaskConfirmBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── AI Task Suggestions ──
  aiDreamTag: {
    ...typography.caption, color: colors.aiAccent, fontWeight: '600',
    flex: 1, textAlign: 'right',
  },
  aiTaskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  aiTaskIndex: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.aiAccentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  aiTaskIndexText: { ...typography.caption, fontWeight: '800', color: colors.aiAccent },
  aiTaskTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  aiTaskDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  aiAddBtn: {
    padding: 2,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Evidence Modal ──
  evidenceOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  evidenceSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: sp.lg, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: sp.md,
  },
  evidenceTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  evidenceSubtitle: {
    ...typography.body, color: colors.primary, fontWeight: '700',
    textAlign: 'center', marginTop: 4, marginBottom: sp.sm,
  },
  evidenceHint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: sp.md },
  evidencePickArea: {
    borderRadius: borderRadius.xl, overflow: 'hidden',
    borderWidth: 2, borderColor: colors.borderLight, borderStyle: 'dashed',
    marginBottom: sp.md, height: 200,
  },
  evidencePreview: { width: '100%', height: '100%' },
  evidencePlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt,
  },
  evidencePlaceholderText: { ...typography.bodySmall, color: colors.textLight },
  evidenceBtnRow: { flexDirection: 'row', gap: 12 },
  evidenceBtn: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  evidenceBtnCancel: { backgroundColor: colors.surfaceAlt },
  evidenceBtnConfirm: { backgroundColor: colors.primary },
  evidenceBtnCancelText: { ...typography.buttonSm, color: colors.textSecondary },
  evidenceBtnConfirmText: { ...typography.buttonSm, color: '#fff' },
});
