import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { theme } from '../../utils/theme';

type FilterType = 'all' | 'challenge' | 'personal' | 'obstacle';

export default function SubmissionsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [daysFilter, setDaysFilter] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['teacherSubmissions', user?.id, daysFilter],
    queryFn: () => apiService.getTeacherSubmissions(user!.id, daysFilter),
    enabled: !!user?.id,
  });

  const { data: students } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: () => apiService.getTeacherStudents(user!.id),
    enabled: !!user?.id,
  });

  const studentMap = new Map((students || []).map((s: any) => [s.id, s]));

  const filteredSubmissions = submissions?.filter((s: any) => {
    if (filter === 'all') return true;
    const taskType = s.tasks?.type;
    if (filter === 'challenge') return taskType === 'challenge';
    if (filter === 'personal') return taskType === 'personal';
    if (filter === 'obstacle') return s.tasks?.title?.includes('克服阻碍');
    return true;
  }) || [];

  const groupedSubmissions = filteredSubmissions.reduce((acc: any, s: any) => {
    const date = new Date(s.completed_at).toLocaleDateString('zh-CN');
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>提交记录</Text>
      </View>

      {/* Days Filter */}
      <View style={styles.daysFilter}>
        {[3, 7, 14, 30].map(days => (
          <TouchableOpacity
            key={days}
            style={[styles.daysButton, daysFilter === days && styles.daysButtonActive]}
            onPress={() => setDaysFilter(days)}
          >
            <Text style={[styles.daysButtonText, daysFilter === days && styles.daysButtonTextActive]}>
              {days === 30 ? '30天' : `${days}天`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeFilter}
        contentContainerStyle={styles.typeFilterContent}
      >
        {[
          { id: 'all', label: '全部', icon: 'list' },
          { id: 'challenge', label: '挑战', icon: 'sparkles' },
          { id: 'personal', label: '任务', icon: 'checkmark-circle' },
          { id: 'obstacle', label: '阻碍', icon: 'warning' },
        ].map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.typeButton, filter === f.id && styles.typeButtonActive]}
            onPress={() => setFilter(f.id as FilterType)}
          >
            <Ionicons
              name={f.icon as any}
              size={16}
              color={filter === f.id ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.typeButtonText, filter === f.id && styles.typeButtonTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : Object.keys(groupedSubmissions).length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>暂无提交记录</Text>
          </View>
        ) : (
          Object.entries(groupedSubmissions).map(([date, items]: [string, any]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {(items as any[]).map(item => {
                const student = studentMap.get(item.student_id);
                return (
                  <View key={item.id} style={styles.submissionItem}>
                    <View style={styles.submissionIcon}>
                      <Ionicons
                        name={
                          item.tasks?.type === 'challenge' ? 'sparkles' :
                          item.tasks?.title?.includes('克服阻碍') ? 'warning' :
                          'checkmark-circle'
                        }
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.submissionContent}>
                      <Text style={styles.submissionTask}>{item.tasks?.title || '任务'}</Text>
                      <Text style={styles.submissionStudent}>{(student as any)?.full_name || '未知学生'}</Text>
                    </View>
                    <Text style={styles.submissionTime}>
                      {new Date(item.completed_at).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
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
  title: { ...theme.typography.h2, color: theme.colors.text },
  daysFilter: {
    flexDirection: 'row', gap: theme.spacing.xs, padding: theme.spacing.md,
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  daysButton: {
    flex: 1, paddingVertical: theme.spacing.xs, alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  daysButtonActive: { backgroundColor: `${theme.colors.primary}20` },
  daysButtonText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  daysButtonTextActive: { color: theme.colors.primary, fontWeight: '600' },
  typeFilter: {
    backgroundColor: theme.colors.surface, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeFilterContent: {
    flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.md,
  },
  typeButton: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border,
  },
  typeButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeButtonText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  typeButtonTextActive: { color: '#fff' },
  content: { flex: 1, padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xxl },
  loadingText: { ...theme.typography.body, color: theme.colors.textSecondary },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary },
  dateGroup: { marginBottom: theme.spacing.lg },
  dateHeader: {
    ...theme.typography.label, color: theme.colors.textSecondary, fontWeight: '600',
    marginBottom: theme.spacing.sm, marginLeft: theme.spacing.xs,
  },
  submissionItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  submissionIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md,
  },
  submissionContent: { flex: 1 },
  submissionTask: { ...theme.typography.body, color: theme.colors.text, fontWeight: '500' },
  submissionStudent: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  submissionTime: { ...theme.typography.caption, color: theme.colors.textSecondary },
});
