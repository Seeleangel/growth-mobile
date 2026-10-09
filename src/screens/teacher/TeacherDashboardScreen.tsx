import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { theme } from '../../utils/theme';

export default function TeacherDashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: teacherClass } = useQuery({
    queryKey: ['teacherClass', user?.id],
    queryFn: () => apiService.getTeacherClass(user!.id),
    enabled: !!user?.id,
  });

  const { data: students } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: () => apiService.getTeacherStudents(user!.id),
    enabled: !!user?.id,
  });

  const { data: submissions } = useQuery({
    queryKey: ['teacherSubmissions', user?.id],
    queryFn: () => apiService.getTeacherSubmissions(user!.id, 7),
    enabled: !!user?.id,
  });

  const { data: obstaclesSummary } = useQuery({
    queryKey: ['classObstacles', user?.id],
    queryFn: () => apiService.getClassObstaclesSummary(user!.id, 7),
    enabled: !!user?.id,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // All queries will be refetched automatically
    setRefreshing(false);
  }, []);

  const studentCount = students?.length || 0;
  const recentSubmissions = submissions?.slice(0, 5) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>教师工作台</Text>

      {/* Class Info */}
      {teacherClass ? (
        <View style={styles.classCard}>
          <Text style={styles.className}>{teacherClass.name}</Text>
          <Text style={styles.classCode}>班级码: {teacherClass.invite_code || '-'}</Text>
          <View style={styles.classStats}>
            <View style={styles.classStat}>
              <Text style={styles.classStatValue}>{studentCount}</Text>
              <Text style={styles.classStatLabel}>学生</Text>
            </View>
            <View style={styles.classStat}>
              <Text style={styles.classStatValue}>{teacherClass.grade || '-'}</Text>
              <Text style={styles.classStatLabel}>年级</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noClassCard}>
          <Text style={styles.noClassText}>尚未创建班级</Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{studentCount}</Text>
          <Text style={styles.statLabel}>学生总数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{recentSubmissions.length}</Text>
          <Text style={styles.statLabel}>本周提交</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{obstaclesSummary?.total || 0}</Text>
          <Text style={styles.statLabel}>待处理阻碍</Text>
        </View>
      </View>

      {/* Recent Submissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近提交</Text>
        {recentSubmissions.length === 0 ? (
          <Text style={styles.emptyText}>暂无提交记录</Text>
        ) : (
          recentSubmissions.map((submission: any) => (
            <View key={submission.id} style={styles.submissionItem}>
              <Text style={styles.submissionTask}>
                {submission.tasks?.title || '任务'}
              </Text>
              <Text style={styles.submissionDate}>
                {new Date(submission.completed_at).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Obstacles Summary */}
      {obstaclesSummary && obstaclesSummary.total > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>班级阻碍概览</Text>
          {obstaclesSummary.by_type.map((item: any) => (
            <View key={item.type} style={styles.obstacleRow}>
              <Text style={styles.obstacleType}>
                {item.type === 'academic' ? '学业' :
                 item.type === 'emotional' ? '情绪' :
                 item.type === 'social' ? '社交' :
                 item.type === 'family' ? '家庭' : '其他'}
              </Text>
              <Text style={styles.obstacleCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingTop: 60 },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.lg },
  classCard: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, marginBottom: theme.spacing.lg,
  },
  className: { ...theme.typography.h3, color: '#fff', marginBottom: theme.spacing.xs },
  classCode: { ...theme.typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: theme.spacing.md },
  classStats: { flexDirection: 'row', gap: theme.spacing.xl },
  classStat: { alignItems: 'center' },
  classStatValue: { ...theme.typography.h2, color: '#fff' },
  classStatLabel: { ...theme.typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  noClassCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl, marginBottom: theme.spacing.lg, alignItems: 'center',
    ...theme.shadows.sm,
  },
  noClassText: { ...theme.typography.body, color: theme.colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, alignItems: 'center', ...theme.shadows.sm,
  },
  statValue: { ...theme.typography.h3, color: theme.colors.primary },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md, marginBottom: theme.spacing.md, ...theme.shadows.sm,
  },
  sectionTitle: { ...theme.typography.h4, color: theme.colors.text, marginBottom: theme.spacing.md },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.md },
  submissionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  submissionTask: { ...theme.typography.body, color: theme.colors.text },
  submissionDate: { ...theme.typography.caption, color: theme.colors.textSecondary },
  obstacleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  obstacleType: { ...theme.typography.body, color: theme.colors.text },
  obstacleCount: { ...theme.typography.label, color: theme.colors.primary, fontWeight: '600' },
});
