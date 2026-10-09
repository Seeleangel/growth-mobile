import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions, SafeAreaView, Platform
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Polygon, Line, Circle, Text as SvgText, G, Polyline, Rect, Defs, LinearGradient as SvgLinGrad, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { colors, gradients, borderRadius as br, shadows, typography, spacing as sp, layout } from '../../utils/theme';
import { theme } from '../../utils/theme';
import { GrowthSkeleton } from '../../components/common';
import { GrowthChart } from '../../api/types';
import { GROWTH_DIMENSIONS } from '../../utils/constants';

const { width } = Dimensions.get('window');

// ─── Smooth eased progress 0→1 animation hook ───────────────────────────────
function useAnimatedProgress(trigger: any, duration = 800) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<any>(null);
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const animate = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trigger, duration]);
  return progress;
}

export default function GrowthScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'radar' | 'trend'>('trend');
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [activeDim, setActiveDim] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data if API fails or is empty for demo
  const mockChartData = {
    optimism: 85,
    resilience: 70,
    social: 90,
    academic: 65,
    creativity: 80,
    curiosity: 75
  };

  const { data: growthChart, isLoading } = useQuery<GrowthChart>({
    queryKey: ['growthChart', user?.id],
    queryFn: async () => {
        try {
            return await apiService.getGrowthChart(user!.id);
        } catch (e) {
            console.log('Error fetching growth chart, using mock', e);
            return { current: mockChartData, weekly: [], daily: [] } as any;
        }
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['growthStats', user?.id],
    queryFn: () => apiService.getGrowthStats(user!.id),
    enabled: !!user?.id,
  });

  // 复用与个人信息页相同的 studentStats（同 queryKey 命中缓存，无额外请求）
  const { data: studentStats } = useQuery({
    queryKey: ['studentStats', user?.id],
    queryFn: () => apiService.getStudentStats(user!.id),
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['growthChart', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['growthStats', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['studentStats', user?.id] }),
    ]);
    setRefreshing(false);
  }, [user?.id, queryClient]);

  // Chart entrance animations — placed after useQuery so isLoading is in scope
  const radarProgress = useAnimatedProgress(
    selectedTab === 'radar' ? `radar-${isLoading}` : null,
    900
  );
  const trendProgress = useAnimatedProgress(
    selectedTab === 'trend' ? `trend-${trendPeriod}-${isLoading}` : null,
    750
  );

  const renderRadarChart = () => {
    // Default dimensions if import fails or is empty
    const dimensions = GROWTH_DIMENSIONS?.length ? GROWTH_DIMENSIONS : [
        { key: 'optimism', label: '乐观', color: '#F59E0B' },
        { key: 'resilience', label: '坚毅', color: '#EF4444' },
        { key: 'social', label: '社交', color: '#3B82F6' },
        { key: 'academic', label: '学术', color: '#8B5CF6' },
        { key: 'creativity', label: '创造', color: '#EC4899' },
        { key: 'curiosity', label: '好奇', color: '#10B981' },
    ];

    const data = growthChart?.current || mockChartData;
    // Clamp radar size: max 280px, responsive on narrow screens
    const size = Math.min(width - 60, 280);
    const center = size / 2;
    const radius = size / 2 - 30;
    const maxValue = 100;

    const getPoint = (value: number, index: number) => {
      const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
      const distance = (value / maxValue) * radius;
      return {
        x: center + distance * Math.cos(angle),
        y: center + distance * Math.sin(angle),
      };
    };

    const points = dimensions.map((d, i) => {
      const value = ((data as any)[d.key] || 60) * radarProgress; // Animated scale from 0
      const p = getPoint(value, i);
      return `${p.x},${p.y}`;
    }).join(' ');

    return (
      <Animated.View entering={FadeIn.duration(400)} style={gs.chartCard}>
         <Text style={gs.chartTitle}>能力雷达图</Text>
        <View style={gs.chartInner}>
            <Svg width={size} height={size}>
            {/* Background Webs */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                <Polygon
                key={scale}
                points={dimensions.map((_, i) => {
                    const p = getPoint(maxValue * scale, i);
                    return `${p.x},${p.y}`;
                }).join(' ')}
                stroke="#E2E8F0"
                strokeWidth="1"
                fill={scale === 1 ? "#F8FAFC" : "transparent"}
                />
            ))}

            {/* Axes */}
            {dimensions.map((_, i) => {
                const p = getPoint(maxValue, i);
                return (
                <Line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                />
                );
            })}

            {/* Data Area */}
            <Polygon
                points={points}
                fill={`rgba(224, 122, 95, ${0.18 * radarProgress})`}
                stroke={colors.primary}
                strokeWidth="3"
                opacity={radarProgress}
            />

            {/* Data Points */}
            {dimensions.map((d, i) => {
                const value = ((data as any)[d.key] || 60) * radarProgress;
                const p = getPoint(value, i);
                return (
                <Circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={d.color || colors.primary}
                    stroke="#fff"
                    strokeWidth="2"
                    opacity={radarProgress}
                />
                );
            })}

            {/* Labels */}
            {dimensions.map((d, i) => {
                const p = getPoint(maxValue + 20, i);
                return (
                <SvgText
                    key={i}
                    x={p.x}
                    y={p.y}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#64748B"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {d.label}
                </SvgText>
                );
            })}
            </Svg>
        </View>
      </Animated.View>
    );
  };

  // Mock weekly / daily data when API returns empty
  const mockWeekly = [
    { label: '周一', optimism: 72, grit: 65, creativity: 58, social: 80, achievement: 60 },
    { label: '周二', optimism: 75, grit: 68, creativity: 62, social: 78, achievement: 65 },
    { label: '周三', optimism: 70, grit: 72, creativity: 65, social: 82, achievement: 70 },
    { label: '周四', optimism: 78, grit: 70, creativity: 70, social: 85, achievement: 72 },
    { label: '周五', optimism: 82, grit: 75, creativity: 74, social: 88, achievement: 78 },
    { label: '周六', optimism: 85, grit: 78, creativity: 80, social: 90, achievement: 82 },
    { label: '周日', optimism: 88, grit: 80, creativity: 82, social: 92, achievement: 85 },
  ];
  const mockDaily = [
    { label: '6h',  optimism: 60, grit: 55, creativity: 50, social: 65, achievement: 58 },
    { label: '9h',  optimism: 68, grit: 62, creativity: 58, social: 72, achievement: 64 },
    { label: '12h', optimism: 75, grit: 70, creativity: 65, social: 80, achievement: 72 },
    { label: '15h', optimism: 80, grit: 74, creativity: 70, social: 85, achievement: 78 },
    { label: '18h', optimism: 85, grit: 78, creativity: 76, social: 88, achievement: 82 },
    { label: '21h', optimism: 82, grit: 76, creativity: 78, social: 86, achievement: 80 },
  ];

  const renderTrendChart = () => {
    const dimList = [
      { key: 'optimism', label: '乐观', color: '#F59E0B' },
      { key: 'grit', label: '坚毅', color: '#EF4444' },
      { key: 'social', label: '社交', color: '#3B82F6' },
      { key: 'creativity', label: '创造', color: '#EC4899' },
      { key: 'achievement', label: '成就', color: '#10B981' },
    ];
    const seriesData = trendPeriod === 'weekly'
      ? (growthChart?.weekly?.length ? growthChart.weekly : mockWeekly)
      : (growthChart?.daily?.length ? growthChart.daily : mockDaily);

    const chartW = Math.min(width - 48, 340);
    const chartH = 180;
    const padL = 32;
    const padR = 12;
    const padT = 12;
    const padB = 28;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;
    const maxVal = 100;
    const stepCount = seriesData.length;

    const getX = (i: number) => padL + (i / Math.max(stepCount - 1, 1)) * innerW;
    const getY = (v: number) => padT + innerH - (v / maxVal) * innerH;

    // activeDim state is at component level to respect hooks rules

    // Clip visible data points for "draw from left" effect
    const visibleCount = Math.max(2, Math.round(trendProgress * seriesData.length));
    const visibleData = seriesData.slice(0, visibleCount);

    return (
      <Animated.View entering={FadeIn.duration(400)} style={gs.chartCard}>
        <View style={gs.trendHeader}>
          <Text style={gs.chartTitle}>能力趋势</Text>
          <View style={gs.periodSwitch}>
            <TouchableOpacity
              style={[gs.periodBtn, trendPeriod === 'daily' && gs.periodBtnActive]}
              onPress={() => setTrendPeriod('daily')}
            >
              <Text style={[gs.periodText, trendPeriod === 'daily' && gs.periodTextActive]}>日</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.periodBtn, trendPeriod === 'weekly' && gs.periodBtnActive]}
              onPress={() => setTrendPeriod('weekly')}
            >
              <Text style={[gs.periodText, trendPeriod === 'weekly' && gs.periodTextActive]}>周</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Svg width={chartW} height={chartH}>
          {/* Y-axis grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <G key={v}>
              <Line x1={padL} y1={getY(v)} x2={chartW - padR} y2={getY(v)} stroke={colors.borderLight} strokeWidth={1} strokeDasharray="4,4" />
              <SvgText x={padL - 6} y={getY(v) + 4} fontSize={10} fill={colors.textTertiary} textAnchor="end">{v}</SvgText>
            </G>
          ))}
          {/* X-axis labels */}
          {seriesData.map((pt, i) => (
            <SvgText key={i} x={getX(i)} y={chartH - 4} fontSize={10} fill={colors.textTertiary} textAnchor="middle">{pt.label}</SvgText>
          ))}
          {/* Data lines — drawn progressively left-to-right */}
          {dimList.map((dim) => {
            const pts = visibleData.map((pt, i) => `${getX(i)},${getY((pt as any)[dim.key] || 0)}`).join(' ');
            if (visibleData.length < 2) return null;
            const isActive = activeDim === dim.key || !activeDim;
            return (
              <Polyline
                key={dim.key}
                points={pts}
                fill="none"
                stroke={dim.color}
                strokeWidth={isActive ? 2.5 : 1}
                opacity={(isActive ? 1 : 0.3) * Math.min(trendProgress * 3, 1)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {/* Data dots */}
          {dimList.map(dim => {
            const isActive = activeDim === dim.key || !activeDim;
            if (!isActive) return null;
            return visibleData.map((pt, i) => (
              <Circle
                key={`${dim.key}-${i}`}
                cx={getX(i)}
                cy={getY((pt as any)[dim.key] || 0)}
                r={3}
                fill="#fff"
                stroke={dim.color}
                strokeWidth={2}
                opacity={Math.min(trendProgress * 4, 1)}
              />
            ));
          })}
        </Svg>

        {/* Legend chips */}
        <View style={gs.legendRow}>
          {dimList.map(dim => (
            <TouchableOpacity
              key={dim.key}
              style={[gs.legendChip, activeDim === dim.key && { backgroundColor: `${dim.color}20`, borderColor: dim.color }]}
              onPress={() => setActiveDim(prev => prev === dim.key ? null : dim.key)}
              activeOpacity={0.7}
            >
              <View style={[gs.legendDot, { backgroundColor: dim.color }]} />
              <Text style={[gs.legendText, activeDim === dim.key && { color: dim.color, fontWeight: '700' }]}>{dim.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  if (isLoading && !growthChart) {
    return <GrowthSkeleton />;
  }

  return (
    <View style={gs.container}>
        <SafeAreaView style={{flex: 1}}>
            <ScrollView
                style={gs.scrollView}
                contentContainerStyle={gs.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Gradient Header */}
                <LinearGradient colors={gradients.primaryHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={gs.heroHeader}>
                    <Animated.Text entering={FadeInDown.delay(100).springify()} style={gs.heroTitle}>成长档案</Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(200).springify()} style={gs.heroSub}>记录你每一天的进步</Animated.Text>
                </LinearGradient>

                {/* Stats Grid */}
                <Animated.View entering={FadeInDown.delay(150).springify()} style={gs.statsGrid}>
                    <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={gs.statCard}>
                        <View style={[gs.iconBox, { backgroundColor: '#BFDBFE' }]}>
                            <Ionicons name="trophy" size={22} color="#2563EB" />
                        </View>
                        <Text style={gs.statValue}>{stats?.metrics?.total_challenges || 12}</Text>
                        <Text style={gs.statLabel}>完成挑战</Text>
                    </LinearGradient>
                    <LinearGradient colors={[`${colors.primary}15`, `${colors.primary}25`]} style={gs.statCard}>
                        <View style={[gs.iconBox, { backgroundColor: `${colors.primary}35` }]}>
                            <Ionicons name="time" size={22} color={colors.primaryDark} />
                        </View>
                        <Text style={gs.statValue}>{stats?.account_age_days || 5}</Text>
                        <Text style={gs.statLabel}>成长天数</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={gs.statCard}>
                        <View style={[gs.iconBox, { backgroundColor: '#FED7AA' }]}>
                            <Ionicons name="star" size={22} color="#EA580C" />
                        </View>
                        <Text style={gs.statValue}>Lv.{studentStats?.level?.level || 1}</Text>
                        <Text style={gs.statLabel}>当前等级</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Chart Tab Switcher */}
                <View style={gs.chartTabs}>
                  <TouchableOpacity
                    style={[gs.chartTab, selectedTab === 'trend' && gs.chartTabActive]}
                    onPress={() => setSelectedTab('trend')}
                  >
                    <Ionicons name="bar-chart" size={15} color={selectedTab === 'trend' ? '#fff' : colors.textSecondary} />
                    <Text style={[gs.chartTabText, selectedTab === 'trend' && gs.chartTabTextActive]}>趋势图</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[gs.chartTab, selectedTab === 'radar' && gs.chartTabActive]}
                    onPress={() => setSelectedTab('radar')}
                  >
                    <Ionicons name="radio" size={15} color={selectedTab === 'radar' ? '#fff' : colors.textSecondary} />
                    <Text style={[gs.chartTabText, selectedTab === 'radar' && gs.chartTabTextActive]}>雷达图</Text>
                  </TouchableOpacity>
                </View>

                {selectedTab === 'trend' ? renderTrendChart() : renderRadarChart()}

                {/* Recent Highlights */}
                <View style={gs.sectionHeader}>
                    <Text style={gs.sectionTitle}>最近高光时刻</Text>
                    <TouchableOpacity>
                        <Text style={gs.seeAllText}>查看全部</Text>
                    </TouchableOpacity>
                </View>

                <View style={gs.timelineContainer}>
                    {[1,2,3].map((_, i) => (
                        <Animated.View key={i} entering={FadeInDown.delay(300 + i * 100).springify()} style={gs.timelineItem}>
                             <View style={gs.timelineLeft}>
                                <View style={gs.timelineLine} />
                                <View style={[gs.timelineDot, { backgroundColor: i===0 ? colors.primary : colors.border }]} />
                             </View>
                             <View style={gs.timelineContent}>
                                <Text style={gs.timelineDate}>今天 10:30</Text>
                                <View style={gs.timelineCard}>
                                    <View style={gs.timelineHeader}>
                                        <Ionicons name={i===0 ? "checkbox" : "leaf"} size={16} color={i===0 ? colors.primary : colors.textLight} />
                                        <Text style={gs.timelineTitleText}>完成了 "收拾书包" 挑战</Text>
                                    </View>
                                    <Text style={gs.timelineDesc}>获得 +50 坚毅值，表现非常棒！继续保持！</Text>
                                </View>
                             </View>
                        </Animated.View>
                    ))}
                </View>

                <View style={{height: layout.tabBarHeight + sp['3xl']}} />
            </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const gs = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  content: { paddingBottom: 20 },

  heroHeader: { paddingTop: 48, paddingBottom: 28, paddingHorizontal: sp.lg, borderBottomLeftRadius: br.xxl, borderBottomRightRadius: br.xxl, marginBottom: sp.lg },
  heroTitle: { ...typography.h1, color: '#fff', marginBottom: 4, textAlign: 'center' },
  heroSub: { ...typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: sp.xl, paddingHorizontal: sp.lg },
  statCard: { flex: 1, borderRadius: br.xl, padding: sp.md, alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { ...typography.h3, color: colors.text, marginBottom: 2 },
  statLabel: { ...typography.caption, color: colors.textSecondary },

  chartCard: {
    backgroundColor: '#fff', borderRadius: br.xxl, padding: sp.lg, marginBottom: sp.xl, marginHorizontal: sp.lg,
    ...shadows.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
  chartTitle: { ...typography.h3, color: colors.text, marginBottom: 0, alignSelf: 'flex-start' },
  chartInner: { alignItems: 'center', justifyContent: 'center' },

  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: sp.md },
  periodSwitch: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: br.md, padding: 2 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: br.sm },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  periodTextActive: { color: '#fff' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: sp.md },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },

  chartTabs: { flexDirection: 'row', marginHorizontal: sp.lg, marginBottom: sp.md, backgroundColor: colors.surface, borderRadius: br.lg, padding: 3 },
  chartTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: br.md },
  chartTabActive: { backgroundColor: colors.primary, ...shadows.xs },
  chartTabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chartTabTextActive: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md, paddingHorizontal: sp.lg },
  sectionTitle: { ...typography.h3, color: colors.text },
  seeAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  timelineContainer: { paddingLeft: sp.lg + 8 },
  timelineItem: { flexDirection: 'row', marginBottom: sp.lg },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: sp.md },
  timelineLine: { position: 'absolute', top: 24, bottom: -24, width: 2, backgroundColor: colors.borderLight },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', zIndex: 1, marginTop: 6 },
  timelineContent: { flex: 1, paddingRight: sp.lg },
  timelineDate: { ...typography.caption, color: colors.textLight, fontWeight: '600', marginBottom: 6 },
  timelineCard: { backgroundColor: '#fff', padding: sp.md, borderRadius: br.lg, ...shadows.xs, borderWidth: 1, borderColor: colors.borderLight },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timelineTitleText: { ...typography.body, fontWeight: '700', color: colors.text },
  timelineDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
});
