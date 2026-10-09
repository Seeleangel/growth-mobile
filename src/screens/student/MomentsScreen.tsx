import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Image, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { colors, gradients, shadows, typography, spacing as sp, borderRadius as br, layout } from '../../utils/theme';
import { theme } from '../../utils/theme';
import { Avatar, LoadingSpinner, SmoothImage, SkeletonCard } from '../../components/common';
import { Images } from '../../assets/images';
import { ClassMoment, MomentComment } from '../../api/types';
import { MOMENT_TYPES } from '../../utils/constants';
import * as ImagePicker from 'expo-image-picker';

type CommentModalData = { momentId: string; commentCount: number } | null;

const TYPE_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  share: { label: '分享', icon: 'chatbubble-ellipses', color: '#6366f1', bg: '#EEF2FF' },
  achievement: { label: '成就', icon: 'trophy', color: '#f59e0b', bg: '#FFFBEB' },
  question: { label: '提问', icon: 'help-circle', color: colors.primary, bg: `${colors.primary}15` },
};

type Classmate = { id: string; name: string; avatar_url?: string | null; is_self?: boolean };

export default function MomentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentModal, setCommentModal] = useState<CommentModalData>(null);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState('share');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: moments, isLoading } = useQuery<ClassMoment[]>({
    queryKey: ['moments', user?.id],
    queryFn: () => apiService.getMoments(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: classmates } = useQuery<Classmate[]>({
    queryKey: ['classmates', user?.id],
    queryFn: () => apiService.getClassmates(user!.id),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let mediaUrl = null;
      if (selectedImage) {
        const fileName = selectedImage.split('/').pop() || 'image.jpg';
        const result = await apiService.uploadMomentMedia({
          fileName,
          mimeType: 'image/jpeg',
          dataBase64: selectedImage.split('base64,')[1] || '',
        });
        mediaUrl = result.media_url;
      }
      await apiService.createMoment({
        student_id: user!.id,
        content: content.trim(),
        type: selectedType as any,
        media_url: mediaUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', user?.id] });
      closeCreateModal();
    },
    onError: (e: any) => Alert.alert('发布失败', e.message),
  });

  const likeMutation = useMutation({
    mutationFn: (momentId: string) => apiService.toggleLike(momentId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', user?.id] });
    },
  });

  const commentsQuery = useQuery<MomentComment[]>({
    queryKey: ['comments', commentModal?.momentId],
    queryFn: () => apiService.getComments(commentModal!.momentId),
    enabled: !!commentModal?.momentId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      await apiService.createComment(commentModal!.momentId, {
        student_id: user!.id,
        content: commentText.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', commentModal?.momentId] });
      queryClient.invalidateQueries({ queryKey: ['moments', user?.id] });
      setCommentText('');
    },
    onError: (e: any) => Alert.alert('评论失败', e.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['moments', user?.id] });
    setRefreshing(false);
  }, [user?.id, queryClient]);

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setContent('');
    setSelectedType('share');
    setSelectedImage(null);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const handlePublish = () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('提示', '请输入内容或选择图片');
      return;
    }
    createMutation.mutate();
  };

  const handleLike = (momentId: string) => {
    likeMutation.mutate(momentId);
  };

  const openComments = (momentId: string, commentCount: number) => {
    setCommentModal({ momentId, commentCount });
  };

  const closeComments = () => {
    setCommentModal(null);
    setCommentText('');
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  const renderMoment = (moment: ClassMoment, index: number) => {
    const typeConfig = TYPE_CONFIG[moment.type] || TYPE_CONFIG.share;
    return (
      <Animated.View key={moment.id} entering={FadeInDown.delay(80 * index).springify()} style={ms.momentCard}>
        <View style={ms.momentHeader}>
          <Avatar name={moment.profiles?.full_name} size={42} />
          <View style={ms.momentHeaderInfo}>
            <View style={ms.momentAuthorRow}>
              <Text style={ms.momentAuthor}>{moment.profiles?.full_name || '匿名'}</Text>
              <View style={[ms.typeBadge, { backgroundColor: typeConfig.bg }]}>
                <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
                <Text style={[ms.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
              </View>
            </View>
            <Text style={ms.momentTime}>{formatTime(moment.created_at)}</Text>
          </View>
        </View>

        <Text style={ms.momentContent}>{moment.content}</Text>

        {moment.media_url && (
          <Image source={{ uri: moment.media_url }} style={ms.momentImage} resizeMode="cover" />
        )}

        <View style={ms.momentActions}>
          <TouchableOpacity style={ms.actionButton} onPress={() => handleLike(moment.id)} activeOpacity={0.7}>
            <Ionicons name={moment.liked_by_me ? 'heart' : 'heart-outline'} size={18} color={moment.liked_by_me ? '#F43F5E' : colors.textLight} />
            <Text style={[ms.actionText, moment.liked_by_me && ms.actionTextActive]}>{moment.like_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.actionButton} onPress={() => openComments(moment.id, moment.comment_count || 0)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textLight} />
            <Text style={ms.actionText}>{moment.comment_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.actionButton} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // FlatList header: hero + classmates
  const ListHeader = useCallback(() => (
    <>
      {/* Classmates Scroll */}
      <View style={ms.classmatesSection}>
        <Text style={ms.sectionTitle}>同学</Text>
        <TouchableOpacity><Text style={ms.seeAllText}>查看全部</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ms.avatarsRow}>
        {/* "发布" button as first item */}
        <TouchableOpacity style={ms.avatarItem} onPress={openCreateModal}>
          <View style={[ms.avatarCircle, ms.addAvatarCircle]}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </View>
          <Text style={ms.avatarName}>发动态</Text>
        </TouchableOpacity>
        {/* Real classmates from database */}
        {(classmates || []).map((mate) => (
          <TouchableOpacity key={mate.id} style={ms.avatarItem}>
            <View style={[ms.avatarCircle, mate.is_self && { borderColor: colors.primary }]}>
              {mate.avatar_url ? (
                <Image source={{ uri: mate.avatar_url }} style={ms.avatarImg} />
              ) : (
                <Avatar name={mate.name} size={48} />
              )}
            </View>
            <Text style={ms.avatarName} numberOfLines={1}>{mate.is_self ? '我' : mate.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  ), [classmates]);

  // FlatList empty component
  const ListEmpty = useCallback(() => (
    isLoading ? (
      <View style={{ paddingHorizontal: sp.md, gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    ) : (
      <View style={ms.emptyState}>
        <SmoothImage
          source={Images.emptyState}
          style={{ width: 180, height: 180, borderRadius: 16 }}
          delay={100}
          duration={600}
        />
        <Text style={ms.emptyTitle}>还没有动态</Text>
        <Text style={ms.emptyDesc}>发布第一条动态吧</Text>
      </View>
    )
  ), [isLoading]);

  const renderMomentItem = useCallback(({ item, index }: { item: ClassMoment; index: number }) => {
    return renderMoment(item, index);
  }, []);

  return (
    <View style={ms.container}>
      {/* Gradient Header */}
      <LinearGradient colors={gradients.primaryHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ms.heroHeader}>
        <Animated.Text entering={FadeInDown.delay(100).springify()} style={ms.heroTitle}>班级动态</Animated.Text>
      </LinearGradient>

      <FlatList
        data={moments || []}
        keyExtractor={(item) => item.id}
        renderItem={renderMomentItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={<View style={{ height: layout.tabBarHeight + sp['3xl'] }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={moments && moments.length === 0 ? { flexGrow: 1 } : undefined}
      />

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={ms.modalOverlay}>
          <View style={ms.modalSheet}>
            <View style={ms.modalHandle} />
            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>发布动态</Text>
              <TouchableOpacity onPress={closeCreateModal} style={ms.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={ms.typeSelector}>
              {MOMENT_TYPES.map(type => {
                const cfg = TYPE_CONFIG[type.id] || TYPE_CONFIG.share;
                return (
                  <TouchableOpacity key={type.id} style={[ms.typeOption, selectedType === type.id && ms.typeOptionActive]} onPress={() => setSelectedType(type.id)}>
                    <Ionicons name={cfg.icon} size={14} color={selectedType === type.id ? '#fff' : cfg.color} />
                    <Text style={[ms.typeOptionText, selectedType === type.id && ms.typeOptionTextActive]}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={ms.inputContainer}>
              <TextInput style={ms.input} placeholder="分享你的想法..." placeholderTextColor={colors.textLight} value={content} onChangeText={setContent} multiline maxLength={500} textAlignVertical="top" />
            </View>

            {selectedImage && (
              <View style={ms.imagePreview}>
                <Image source={{ uri: selectedImage }} style={ms.previewImage} resizeMode="cover" />
                <TouchableOpacity style={ms.removeImageButton} onPress={() => setSelectedImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={ms.mediaActions}>
              <TouchableOpacity style={ms.mediaButton} onPress={pickImage} activeOpacity={0.7}>
                <Ionicons name="image" size={18} color={colors.primary} />
                <Text style={ms.mediaButtonText}>图片</Text>
              </TouchableOpacity>
            </View>

            <View style={ms.modalActions}>
              <Text style={ms.charCount}>{content.length}/500</Text>
              <TouchableOpacity style={[ms.publishBtn, (!content.trim() && !selectedImage) && ms.publishBtnDisabled]} onPress={handlePublish} disabled={createMutation.isPending || (!content.trim() && !selectedImage)} activeOpacity={0.8}>
                {createMutation.isPending ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={ms.publishBtnText}>发布</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={!!commentModal} animationType="slide" transparent>
        <View style={ms.modalOverlay}>
          <View style={ms.commentsModalSheet}>
            <View style={ms.modalHandle} />
            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>评论 ({commentModal?.commentCount || 0})</Text>
              <TouchableOpacity onPress={closeComments} style={ms.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={ms.commentsList} showsVerticalScrollIndicator={false}>
              {commentsQuery.data?.map(comment => (
                <View key={comment.id} style={ms.commentItem}>
                  <Avatar name={comment.profiles?.full_name} size={34} />
                  <View style={ms.commentContent}>
                    <View style={ms.commentHeader}>
                      <Text style={ms.commentAuthor}>{comment.profiles?.full_name || '匿名'}</Text>
                      <Text style={ms.commentTime}>{formatTime(comment.created_at)}</Text>
                    </View>
                    <Text style={ms.commentText}>{comment.content}</Text>
                  </View>
                </View>
              ))}
              {commentsQuery.isLoading && <LoadingSpinner message="加载评论中..." />}
            </ScrollView>

            <View style={ms.commentInputRow}>
              <TextInput style={ms.commentInput} placeholder="写下你的评论..." placeholderTextColor={colors.textLight} value={commentText} onChangeText={setCommentText} multiline={false} />
              <TouchableOpacity style={[ms.sendButton, !commentText.trim() && ms.sendButtonDisabled]} onPress={handleSendComment} disabled={!commentText.trim() || createCommentMutation.isPending} activeOpacity={0.8}>
                {createCommentMutation.isPending ? <ActivityIndicator size={16} color="#fff" /> : <Ionicons name="send" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 52, paddingHorizontal: sp.lg, paddingBottom: 20,
    borderBottomLeftRadius: br.xxl, borderBottomRightRadius: br.xxl,
  },
  heroTitle: { ...typography.h1, color: '#fff' },
  addBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },

  classmatesSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: sp.lg, paddingTop: sp.lg, paddingBottom: sp.sm,
  },
  sectionTitle: { ...typography.h4, color: colors.text },
  seeAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  avatarsRow: { paddingHorizontal: sp.md, paddingBottom: sp.md, gap: 6 },
  avatarItem: { alignItems: 'center', width: 64 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26, overflow: 'hidden',
    marginBottom: 4, backgroundColor: colors.surfaceAlt,
    borderWidth: 2, borderColor: '#fff', ...shadows.xs,
  },
  addAvatarCircle: {
    backgroundColor: `${colors.primary}12`, borderWidth: 2,
    borderColor: colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarName: { ...typography.caption, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },

  momentCard: {
    backgroundColor: '#fff', marginHorizontal: sp.md, marginBottom: sp.sm,
    borderRadius: br.xl, padding: sp.md,
    ...shadows.xs, borderWidth: 1, borderColor: colors.borderLight,
  },
  momentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  momentHeaderInfo: { flex: 1 },
  momentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  momentAuthor: { ...typography.body, fontWeight: '700', color: colors.text },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: br.full },
  typeText: { fontSize: 10, fontWeight: '700' },
  momentTime: { ...typography.caption, color: colors.textLight },
  momentContent: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: 10 },
  momentImage: { width: '100%', height: 200, borderRadius: br.lg, marginBottom: 10 },
  momentActions: {
    flexDirection: 'row', gap: 20, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { ...typography.caption, color: colors.textLight, fontWeight: '600' },
  actionTextActive: { color: '#F43F5E' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { ...typography.body, color: colors.textLight, fontWeight: '600', marginTop: 12 },
  emptyDesc: { ...typography.caption, color: colors.border, marginTop: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: br.xxl, borderTopRightRadius: br.xxl,
    padding: sp.lg, paddingBottom: 40, maxHeight: '90%',
  },
  commentsModalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: br.xxl, borderTopRightRadius: br.xxl,
    padding: sp.lg, paddingBottom: sp.lg, height: '80%',
  },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: sp.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.lg },
  modalTitle: { ...typography.h3, color: colors.text },
  modalCloseBtn: { padding: 4, backgroundColor: colors.surfaceAlt, borderRadius: br.full },

  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: sp.md },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: br.full,
    borderWidth: 1, borderColor: colors.borderLight, backgroundColor: '#fff',
  },
  typeOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeOptionText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  typeOptionTextActive: { color: '#fff' },

  inputContainer: { backgroundColor: colors.surfaceAlt, borderRadius: br.lg, padding: sp.md, marginBottom: sp.md, minHeight: 100 },
  input: { ...typography.body, color: colors.text, textAlignVertical: 'top' },

  imagePreview: { marginBottom: sp.md },
  previewImage: { width: '100%', height: 200, borderRadius: br.lg },
  removeImageButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },

  mediaActions: { flexDirection: 'row', gap: sp.md, marginBottom: sp.lg },
  mediaButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: `${colors.primary}12`, borderRadius: br.lg,
  },
  mediaButtonText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { ...typography.caption, color: colors.textLight },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 11, borderRadius: br.full,
  },
  publishBtnDisabled: { backgroundColor: colors.border },
  publishBtnText: { ...typography.buttonSm, color: '#fff' },

  commentsList: { flex: 1, marginBottom: sp.md },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: sp.md },
  commentContent: { flex: 1, backgroundColor: colors.surfaceAlt, padding: sp.sm, borderRadius: br.lg, borderTopLeftRadius: 4 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  commentAuthor: { ...typography.caption, fontWeight: '700', color: colors.text },
  commentTime: { ...typography.caption, fontSize: 10, color: colors.textLight },
  commentText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },

  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: sp.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight,
  },
  commentInput: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: br.full,
    paddingHorizontal: 14, paddingVertical: 10, ...typography.caption,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: colors.border },
});
