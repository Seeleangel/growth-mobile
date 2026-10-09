import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, SafeAreaView, Dimensions, Platform
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { colors, gradients, shadows, typography, spacing as sp, borderRadius as br, layout } from '../../utils/theme';
import { theme } from '../../utils/theme';
import { LoadingSpinner, SmoothImage } from '../../components/common';
import { Images } from '../../assets/images';
import { CHALLENGE_CATEGORIES, CHALLENGES_PER_ROUND } from '../../utils/constants';
import { Task } from '../../api/types';

const { width } = Dimensions.get('window');
type Phase = 'category' | 'challenge' | 'feedback' | 'summary';

export default function ChallengeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [challenge, setChallenge] = useState<Task | null>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);

  const fetchChallenge = useCallback(async (category: string) => {
    setIsLoadingChallenge(true);
    try {
      const data = await apiService.getRandomChallenge(category, excludeIds);
      setChallenge(data);
      setSelectedOption(null);
      setFeedback('');
      setPhase('challenge');
    } catch (e: any) {
      Alert.alert('错误', e.message || '获取挑战失败');
    } finally {
      setIsLoadingChallenge(false);
    }
  }, [excludeIds]);

  const submitMutation = useMutation({
    mutationFn: async (option: any) => {
      await apiService.submitChallenge({
        student_id: user!.id,
        challenge_id: challenge!.id,
        option_selected: option.id,
        type: option.type,
      });
      return option;
    },
    onSuccess: async (option) => {
      setSelectedOption(option);
      setFeedback(option.feedback || (option.type === 'positive' ? '太棒了！积极的思维方式！' : '换个角度想想，也许会更好！'));
      setExcludeIds(prev => [...prev, challenge!.id]);
      setProgress(prev => prev + 1);
      setPhase('feedback');

      if (progress + 1 >= CHALLENGES_PER_ROUND) {
        try {
          const result = await apiService.getChallengeSummary({
            challenge_title: challenge!.title,
            selected_option: option.text,
            is_positive: option.type === 'positive',
            student_id: user!.id,
          });
          setAiSummary(result.summary || '');
        } catch (e) {
          setAiSummary('');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] });
    },
    onError: (e: any) => Alert.alert('提交失败', e.message),
  });

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setExcludeIds([]);
    setProgress(0);
    fetchChallenge(categoryId);
  };

  const handleSelectOption = (option: any) => {
    if (submitMutation.isPending) return;
    submitMutation.mutate(option);
  };

  const handleNext = () => {
    if (progress >= CHALLENGES_PER_ROUND) {
      setPhase('summary');
    } else {
      fetchChallenge(selectedCategory);
    }
  };

  const handleRestart = () => {
    setPhase('category');
    setChallenge(null);
    setSelectedOption(null);
    setExcludeIds([]);
    setProgress(0);
    setAiSummary('');
  };

  const getCategoryIcon = (id: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      school: 'school-outline',
      home: 'home-outline',
      parent_child: 'people-outline',
      teacher_student: 'person-outline',
      classmate: 'chatbubbles-outline',
      academic: 'book-outline',
    };
    return icons[id] || 'help-circle-outline';
  };

  const getCategoryGrad = (id: string): [string, string] => {
    const map: Record<string, [string, string]> = {
      school:          ['#818CF8', '#6366F1'],
      home:            ['#F472B6', '#EC4899'],
      parent_child:    [colors.primary, colors.primaryDark],
      teacher_student: ['#FBBF24', '#F59E0B'],
      classmate:       ['#60A5FA', '#3B82F6'],
      academic:        ['#A78BFA', '#8B5CF6'],
    };
    return map[id] || ['#94A3B8', '#64748B'];
  };

  if (phase === 'category') {
    return (
      <View style={s.container}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Gradient Header */}
          <LinearGradient colors={gradients.primaryHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroHeader}>
            <Animated.Text entering={FadeInDown.delay(100).springify()} style={s.heroTitle}>乐观思维挑战</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200).springify()} style={s.heroSubtitle}>选择一个场景，开启你的思维探险</Animated.Text>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.categoryGrid} showsVerticalScrollIndicator={false}>
            {CHALLENGE_CATEGORIES.map((cat, index) => {
              const grad = getCategoryGrad(cat.id);
              return (
                <Animated.View key={cat.id} entering={FadeInDown.delay(120 * index).springify()} style={s.catCardWrap}>
                  <TouchableOpacity style={s.catCard} onPress={() => handleSelectCategory(cat.id)} activeOpacity={0.85}>
                    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.catIconCircle}>
                      <Ionicons name={getCategoryIcon(cat.id)} size={28} color="#fff" />
                    </LinearGradient>
                    <Text style={s.catLabel}>{cat.label}</Text>
                    <Text style={s.catSub}>Level {index + 1}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
            <View style={{ height: layout.tabBarHeight + sp['3xl'] }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoadingChallenge) {
    return <LoadingSpinner fullScreen message="加载挑战中..." />;
  }

  if (phase === 'summary') {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.phaseContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.delay(200).springify()} style={s.summaryIconWrap}>
            <SmoothImage
              source={Images.celebrate}
              style={{ width: 200, height: 200, borderRadius: 24 }}
              delay={100}
              duration={700}
            />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={s.summaryTitle}>挑战完成！</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(400).springify()} style={s.summarySubtitle}>你完成了 {CHALLENGES_PER_ROUND} 道挑战题</Animated.Text>
          {aiSummary ? (
            <Animated.View entering={FadeInUp.delay(500).springify()} style={s.aiCard}>
              <View style={s.aiHeader}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={s.aiTitle}>AI 成长总结</Text>
              </View>
              <Text style={s.aiText}>{aiSummary}</Text>
            </Animated.View>
          ) : null}
          <TouchableOpacity style={s.primaryBtn} onPress={handleRestart} activeOpacity={0.85}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={s.primaryBtnText}>再来一轮</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!challenge) return null;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.phaseContent} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <Animated.View entering={FadeInDown.springify()} style={s.progressCard}>
          <View style={s.progressRow}>
            <View style={s.progressInfo}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={s.progressText}>进度 {progress}/{CHALLENGES_PER_ROUND}</Text>
            </View>
            <Text style={s.progressPct}>{Math.round((progress / CHALLENGES_PER_ROUND) * 100)}%</Text>
          </View>
          <View style={s.progressBar}><View style={[s.progressFill, { width: `${(progress / CHALLENGES_PER_ROUND) * 100}%` }]} /></View>
        </Animated.View>

        {/* Challenge Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.challengeCard}>
          <LinearGradient colors={getCategoryGrad(selectedCategory)} style={s.challengeIconCircle}>
            <Ionicons name={getCategoryIcon(selectedCategory)} size={28} color="#fff" />
          </LinearGradient>
          <Text style={s.challengeType}>{CHALLENGE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</Text>
          <Text style={s.challengeTitle}>{challenge.title}</Text>
          {challenge.description ? <Text style={s.challengeDesc}>{challenge.description}</Text> : null}
        </Animated.View>

        {/* Options */}
        {phase === 'challenge' && (
          <View style={s.optionsSection}>
            <Text style={s.optionsLabel}>你会怎么想？</Text>
            {(challenge.options || []).map((option: any, idx: number) => (
              <Animated.View key={option.id} entering={FadeInDown.delay(200 + idx * 80).springify()}>
                <TouchableOpacity style={s.optionCard} onPress={() => handleSelectOption(option)} disabled={submitMutation.isPending} activeOpacity={0.8}>
                  <View style={s.optionRadio}>
                    {submitMutation.isPending && selectedOption?.id === option.id ? <View style={s.optionRadioFill} /> : null}
                  </View>
                  <Text style={s.optionText}>{option.text}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Feedback */}
        {phase === 'feedback' && selectedOption && (
          <Animated.View entering={FadeInUp.delay(100).springify()} style={s.feedbackSection}>
            <View style={[s.selectedCard, { borderColor: selectedOption.type === 'positive' ? colors.primary : '#F59E0B' }]}>
              <View style={s.selectedHeader}>
                <LinearGradient colors={selectedOption.type === 'positive' ? [colors.primary, colors.primaryDark] : ['#FBBF24', '#F59E0B']} style={s.selectedIcon}>
                  <Ionicons name={selectedOption.type === 'positive' ? 'checkmark' : 'bulb'} size={18} color="#fff" />
                </LinearGradient>
                <Text style={[s.selectedBadge, { color: selectedOption.type === 'positive' ? colors.primary : '#F59E0B' }]}>
                  {selectedOption.type === 'positive' ? '积极思维 +10 XP' : '继续加油 +2 XP'}
                </Text>
              </View>
              <Text style={s.selectedText}>{selectedOption.text}</Text>
            </View>

            {feedback ? (
              <View style={s.feedbackCard}>
                <View style={s.feedbackHeader}>
                  <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                  <Text style={s.feedbackLabel}>老师点评</Text>
                </View>
                <Text style={s.feedbackText}>{feedback}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={s.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{progress >= CHALLENGES_PER_ROUND ? '查看总结' : '下一题 →'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={{ height: layout.tabBarHeight + sp['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* ── Hero Header ── */
  heroHeader: { paddingTop: 48, paddingBottom: 28, paddingHorizontal: sp.lg, borderBottomLeftRadius: br.xxl, borderBottomRightRadius: br.xxl },
  heroTitle: { ...typography.h1, color: '#fff', marginBottom: 6, textAlign: 'center' },
  heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  /* ── Category Grid ── */
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: sp.lg, paddingTop: sp.xl },
  catCardWrap: { width: (width - sp.lg * 2 - sp.md) / 2, marginBottom: sp.md },
  catCard: {
    backgroundColor: '#fff', borderRadius: br.xl, padding: sp.lg, alignItems: 'center',
    ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  catIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  catLabel: { ...typography.h4, color: colors.text, marginBottom: 2 },
  catSub: { ...typography.caption, color: colors.textLight },

  /* ── Phase shared ── */
  phaseContent: { padding: sp.lg },

  /* ── Progress ── */
  progressCard: { backgroundColor: '#fff', borderRadius: br.xl, padding: sp.md, marginBottom: sp.md, ...shadows.xs, borderWidth: 1, borderColor: colors.borderLight },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  progressPct: { ...typography.h4, color: colors.primary },
  progressBar: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  /* ── Challenge Card ── */
  challengeCard: {
    backgroundColor: '#fff', borderRadius: br.xxl, padding: sp.xl, marginBottom: sp.lg,
    alignItems: 'center', ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  challengeIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  challengeType: { ...typography.overline, color: colors.textLight, marginBottom: 8 },
  challengeTitle: { ...typography.h2, color: colors.text, textAlign: 'center', lineHeight: 30, marginBottom: 10 },
  challengeDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  /* ── Options ── */
  optionsSection: { gap: 12 },
  optionsLabel: { ...typography.h3, color: colors.text, marginBottom: 4, textAlign: 'center' },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: br.lg, padding: sp.md,
    ...shadows.xs, borderWidth: 1, borderColor: colors.borderLight,
  },
  optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  optionRadioFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  optionText: { flex: 1, ...typography.body, color: colors.textSecondary, fontWeight: '600', lineHeight: 22 },

  /* ── Feedback ── */
  feedbackSection: { gap: 16 },
  selectedCard: { backgroundColor: '#fff', borderRadius: br.xl, padding: sp.md, borderWidth: 2 },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  selectedIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  selectedBadge: { ...typography.caption, fontWeight: '700' },
  selectedText: { ...typography.body, color: colors.text, fontWeight: '600', lineHeight: 22 },
  feedbackCard: { backgroundColor: `${colors.primary}10`, borderRadius: br.lg, padding: sp.md },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  feedbackLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  feedbackText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },

  /* ── Primary Button ── */
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: br.full, paddingVertical: 16, paddingHorizontal: 24,
    ...shadows.glow, marginTop: 8,
  },
  primaryBtnText: { ...typography.buttonSm, color: '#fff', fontSize: 17 },

  /* ── Summary ── */
  summaryIconWrap: { alignItems: 'center', marginBottom: 20, marginTop: 40 },
  summaryIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { ...typography.h1, color: colors.text, textAlign: 'center', marginBottom: 8 },
  summarySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  aiCard: { backgroundColor: colors.surfaceAlt, borderRadius: br.xl, padding: sp.lg, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiTitle: { ...typography.h4, color: colors.aiAccent },
  aiText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
});
