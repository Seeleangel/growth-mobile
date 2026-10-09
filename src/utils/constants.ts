// App Constants
export const CHALLENGE_CATEGORIES = [
  { id: 'school', label: '学校', icon: 'school-outline', color: '#6C63FF' },
  { id: 'home', label: '家庭', icon: 'home-outline', color: '#FF6584' },
  { id: 'parent_child', label: '亲子', icon: 'people-outline', color: '#43C6AC' },
  { id: 'teacher_student', label: '师生', icon: 'person-outline', color: '#F59E0B' },
  { id: 'classmate', label: '同学', icon: 'people-circle-outline', color: '#3B82F6' },
  { id: 'academic', label: '学业', icon: 'book-outline', color: '#10B981' },
] as const;

export const MOOD_OPTIONS = [
  { id: 'joy', label: '愉快', emoji: '😊', color: '#FBBF24' },
  { id: 'surprise', label: '惊奇', emoji: '😮', color: '#8B5CF6' },
  { id: 'sadness', label: '悲伤', emoji: '😢', color: '#64748B' },
  { id: 'anger', label: '愤怒', emoji: '😠', color: '#EF4444' },
  { id: 'disgust', label: '厌恶', emoji: '🤢', color: '#10B981' },
  { id: 'fear', label: '惧怕', emoji: '😨', color: '#3B82F6' },
  { id: 'interest', label: '兴趣/好奇', emoji: '🧐', color: '#0EA5E9' },
  { id: 'contempt', label: '轻蔑', emoji: '😒', color: '#6B7280' },
  { id: 'distress', label: '痛苦', emoji: '😣', color: '#F97316' },
] as const;

export const OBSTACLE_TYPES = [
  { id: 'academic', label: '学业' },
  { id: 'emotional', label: '情绪' },
  { id: 'social', label: '社交' },
  { id: 'family', label: '家庭' },
  { id: 'other', label: '其他' },
] as const;

export const OBSTACLE_STATUSES = [
  { id: 'todo', label: '待处理', color: '#F59E0B' },
  { id: 'in_progress', label: '处理中', color: '#3B82F6' },
  { id: 'resolved', label: '已解决', color: '#10B981' },
] as const;

export const MOMENT_TYPES = [
  { id: 'share', label: '分享' },
  { id: 'achievement', label: '成就' },
  { id: 'question', label: '提问' },
] as const;

export const GROWTH_DIMENSIONS = [
  { key: 'optimism', label: '乐观', color: '#86ef5b' },
  { key: 'grit', label: '坚毅', color: '#FF9F43' },
  { key: 'creativity', label: '创造', color: '#43C6AC' },
  { key: 'social', label: '社交', color: '#F59E0B' },
  { key: 'achievement', label: '成就', color: '#10B981' },
] as const;

export const CHALLENGES_PER_ROUND = 10;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: '初学者 🌱' },
  { level: 2, xp: 50, title: '探索者 🌿' },
  { level: 3, xp: 150, title: '成长者 🌳' },
  { level: 4, xp: 300, title: '进步者 🌲' },
  { level: 5, xp: 500, title: '优秀者 🏆' },
  { level: 6, xp: 750, title: '卓越者 ⭐' },
  { level: 7, xp: 1000, title: '大师 🌟' },
  { level: 8, xp: 1500, title: '传奇 👑' },
];
