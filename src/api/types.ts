// API Types
export interface User {
  id: string;
  email?: string;
  full_name?: string;
  role: 'student' | 'teacher';
  avatar_url?: string;
  school_name?: string;
  class_name?: string;
  class_id?: string;
  bio?: string;
  dream?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'challenge' | 'personal' | 'obstacle';
  challenge_category?: 'school' | 'home' | 'parent_child' | 'teacher_student' | 'classmate' | 'academic';
  points_reward?: number;
  image_url?: string;
  options?: TaskOption[];
  created_at?: string;
}

export interface TaskOption {
  id: string;
  text: string;
  type: 'positive' | 'negative';
  feedback?: string;
}

export interface StudentTask {
  id: string;
  student_id: string;
  task_id: string;
  status: 'pending' | 'completed';
  completed_at?: string;
  created_at: string;
  tasks?: Task;
}

export interface Goal {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  target_date?: string;
  dream_tag?: string;
  status: 'active' | 'in_progress' | 'completed';
  progress?: number;
  completed_at?: string;
  created_at: string;
}

export interface Obstacle {
  id: string;
  student_id: string;
  content: string;
  obstacle_type: 'academic' | 'emotional' | 'social' | 'family' | 'other';
  severity: number;
  dream_tag?: string;
  status: 'todo' | 'in_progress' | 'resolved';
  linked_task_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClassMoment {
  id: string;
  student_id: string;
  class_id: string;
  content: string;
  type: 'share' | 'achievement' | 'question';
  media_url?: string;
  likes?: number;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface MomentComment {
  id: string;
  moment_id: string;
  student_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  requirement: string;
  created_at?: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_at: string;
  badges?: Badge;
  unlocked?: boolean;
}

export interface GrowthStats {
  account_age_days: number;
  metrics: {
    total_challenges: number;
    total_portfolios: number;
    streak: number;
  };
  radar: {
    school: number;
    home: number;
    social: number;
    emotion: number;
    other: number;
  };
  trend: Array<{
    date: string;
    count: number;
  }>;
  timeline: Array<{
    type: 'task' | 'moment';
    title: string;
    desc: string;
    date: string;
  }>;
}

export interface GrowthChart {
  current: {
    optimism: number;
    grit: number;
    creativity: number;
    social: number;
    achievement: number;
  };
  weekly: Array<{
    label: string;
    optimism: number;
    grit: number;
    creativity: number;
    social: number;
    achievement: number;
  }>;
  daily: Array<{
    label: string;
    optimism: number;
    grit: number;
    creativity: number;
    social: number;
    achievement: number;
  }>;
}

export interface StudentStats {
  badges: number;
  completed_tasks: number;
  streak: number;
  checked_in_today: boolean;
  level: {
    level: number;
    current_xp: number;
    xp_needed: number;
    progress: number;
  };
}

export interface CheckinStatus {
  checkedInToday: boolean;
  streak: number;
  last_checkin?: string;
}

export interface TeacherSubmission {
  id: string;
  student_id: string;
  task_id: string;
  status: string;
  completed_at: string;
  tasks?: {
    title: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
