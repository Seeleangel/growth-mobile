// Helper functions
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export const formatDateFull = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const getLevelTitle = (level: number): string => {
  const titles = ['初学者', '探索者', '成长者', '进步者', '优秀者', '卓越者', '大师', '传奇'];
  return titles[Math.min(level - 1, titles.length - 1)] || '初学者';
};

export const getObstacleTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    academic: '学业',
    emotional: '情绪',
    social: '社交',
    family: '家庭',
    other: '其他',
  };
  return labels[type] || type;
};

export const getObstacleStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    todo: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
  };
  return labels[status] || status;
};

export const getMoodLabel = (mood: string): string => {
  const labels: Record<string, string> = {
    joy: '愉快',
    surprise: '惊奇',
    sadness: '悲伤',
    anger: '愤怒',
    disgust: '厌恶',
    fear: '惧怕',
    interest: '兴趣/好奇',
    contempt: '轻蔑',
    distress: '痛苦',
    happy: '开心',
    calm: '平静',
    neutral: '一般',
    sad: '难过',
    angry: '生气',
    anxious: '焦虑',
    checkin: '签到',
  };
  return labels[mood] || mood;
};

export const getMoodEmoji = (mood: string): string => {
  const emojis: Record<string, string> = {
    joy: '😊',
    surprise: '😮',
    sadness: '😢',
    anger: '😠',
    disgust: '🤢',
    fear: '😨',
    interest: '🧐',
    contempt: '😒',
    distress: '😣',
    happy: '😊',
    calm: '😌',
    neutral: '😐',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    checkin: '✅',
  };
  return emojis[mood] || '😐';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const imageToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Safe guard for SVG render
declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.SVGProps<SVGSVGElement>;
      polygon: React.SVGProps<SVGPolygonElement>;
    }
  }
}
