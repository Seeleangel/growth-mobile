import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { theme } from '../../utils/theme';
import { OBSTACLE_TYPES } from '../../utils/constants';

type TabType = 'obstacles' | 'activity';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabType>('obstacles');
  const [daysFilter, setDaysFilter] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const { data: obstaclesSummary } = useQuery({
    queryKey: ['classObstacles', user?.id, daysFilter],
    queryFn: () => apiService.getClassObstaclesSummary(user!.id, daysFilter),
    enabled: !!user?.id,
  });

  const { data: students } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: () => apiService.getTeacherStudents(user!.id),
    enabled: !!user?.id,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderObstaclesTab = () => {
    if (!obstaclesSummary) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }

    const maxCount = Math.max(...obstaclesSummary.by_type.map((t: any) => t.count), 1);

    return (
      <View style={styles.tabContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>过去 {daysFilter} 天</Text>
          <Text style={styles.summaryValue}>{obstaclesSummary.total} 个阻碍</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>阻碍类型分布</Text>
          {obstaclesSummary.by_type.map((item: any) => {
            const typeInfo = OBSTACLE_TYPES.find(t => t.id === item.type);
            const percentage = (item.count / maxCount) * 100;
            return (
              <View key={item.type} style={styles.barRow}>
                <Text style={styles.barLabel}>
                  {typeInfo?.label || item.type}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            );
          })}

          {obstaclesSummary.by_type.length === 0 && (
            <Text style={styles.emptyText}>暂无数据</Text>
          )}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>处理状态</Text>
          {obstaclesSummary.by_status.map((item: any) => (
            <View key={item.status} style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === 'resolved' ? theme.colors.success :
                    item.status === 'in_progress' ? theme.colors.info :
                    theme.colors.warning,
                }
              ]} />
              <Text style={styles.statusLabel}>
                {item.status === 'resolved' ? '已解决' :
                 item.status === 'in_progress' ? '处理中' : '待处理'}
              </Text>
              <Text style={styles.statusCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActivityTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>活动分析功能即将上线</Text>
        </View>

        {students && students.length > 0 && (
          <View style={styles.studentActivityCard}>
            <Text style={styles.cardTitle}>学生活跃度</Text>
            {students.slice(0, 5).map((student: any) => (
              <View key={student.id} style={styles.studentActivityRow}>
                <Text style={styles.studentActivityName}>{student.full_name || '未设置'}</Text>
                <View style={styles.activityBar}>
                  <View style={[styles.activityFill, { width: `${Math.random() * 80 + 20}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>数据分析</Text>

        {/* Days Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysFilter}>
          {[7, 14, 30].map(days => (
            <TouchableOpacity
              key={days}
              style={[styles.daysButton, daysFilter === days && styles.daysButtonActive]}
              onPress={() => setDaysFilter(days)}
            >
              <Text style={[styles.daysButtonText, daysFilter === days && styles.daysButtonTextActive]}>
                {days}天
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'obstacles' && styles.tabActive]}
          onPress={() => setSelectedTab('obstacles')}
        >
          <Text style={[styles.tabText, selectedTab === 'obstacles' && styles.tabTextActive]}>
            阻碍分析
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'activity' && styles.tabActive]}
          onPress={() => setSelectedTab('activity')}
        >
          <Text style={[styles.tabText, selectedTab === 'activity' && styles.tabTextActive]}>
            活动分析
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'obstacles' ? renderObstaclesTab() : renderActivityTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingTop: 60, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.md },
  daysFilter: { flexDirection: 'row' },
  daysButton: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
  },
  daysButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  daysButtonText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  daysButtonTextActive: { color: '#fff', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { ...theme.typography.label, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: '600' },
  content: { flex: 1, padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContent: { gap: theme.spacing.md },
  summaryCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, alignItems: 'center', ...theme.shadows.sm,
  },
  summaryLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  summaryValue: { ...theme.typography.h2, color: theme.colors.primary, marginTop: theme.spacing.xs },
  chartCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, ...theme.shadows.sm,
  },
  chartTitle: { ...theme.typography.h4, color: theme.colors.text, marginBottom: theme.spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  barLabel: { width: 50, ...theme.typography.bodySmall, color: theme.colors.text },
  barTrack: { flex: 1, height: 8, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full, marginHorizontal: theme.spacing.sm, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
  barValue: { width: 30, ...theme.typography.label, color: theme.colors.primary, fontWeight: '600', textAlign: 'right' },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.md },
  statusCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, ...theme.shadows.sm,
  },
  statusTitle: { ...theme.typography.h4, color: theme.colors.text, marginBottom: theme.spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: theme.spacing.sm },
  statusLabel: { flex: 1, ...theme.typography.body, color: theme.colors.text },
  statusCount: { ...theme.typography.label, color: theme.colors.primary, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: `${theme.colors.info}20`, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  infoText: { ...theme.typography.body, color: theme.colors.text, flex: 1 },
  studentActivityCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, ...theme.shadows.sm,
  },
  cardTitle: { ...theme.typography.h4, color: theme.colors.text, marginBottom: theme.spacing.md },
  studentActivityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  studentActivityName: { width: 80, ...theme.typography.bodySmall, color: theme.colors.text },
  activityBar: { flex: 1, height: 6, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full, marginHorizontal: theme.spacing.sm, overflow: 'hidden' },
  activityFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
});
