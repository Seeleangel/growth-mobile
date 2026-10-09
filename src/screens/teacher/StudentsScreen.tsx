import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { theme } from '../../utils/theme';

export default function StudentsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: () => apiService.getTeacherStudents(user!.id),
    enabled: !!user?.id,
  });

  const filteredStudents = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>学生管理</Text>
        <Text style={styles.subtitle}>共 {filteredStudents.length} 名学生</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索学生姓名、学校或班级"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {searchQuery ? '没有找到匹配的学生' : '还没有学生加入班级'}
            </Text>
          </View>
        ) : (
          filteredStudents.map((student: any) => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {student.full_name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.full_name || '未设置'}</Text>
                <Text style={styles.studentDetails}>
                  {student.school_name || '-'} · {student.class_name || '-'}
                </Text>
                <Text style={styles.joinedDate}>
                  加入于 {student.created_at ? new Date(student.created_at).toLocaleDateString('zh-CN') : '-'}
                </Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
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
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs, marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  searchIcon: { marginRight: theme.spacing.xs },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text },
  content: { flex: 1, paddingHorizontal: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xxl },
  loadingText: { ...theme.typography.body, color: theme.colors.textSecondary },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  studentAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md,
  },
  studentAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  studentDetails: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  joinedDate: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  moreButton: { padding: theme.spacing.xs },
});
