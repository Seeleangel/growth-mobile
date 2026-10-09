import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL } from '../config/app.config';

// Re-export from app config for backward compatibility
export { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL };

// Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER: '/api/register',
  LOGIN: '/api/login',

  // Student
  STUDENT_STATS: (id: string) => `/api/student/${id}/stats`,
  STUDENT_CHECKIN_STATUS: (id: string) => `/api/student/${id}/checkin`,
  STUDENT_CHECKIN: (id: string) => `/api/student/${id}/checkin`,
  STUDENT_GROWTH_STATS: (id: string) => `/api/student/${id}/growth-stats`,
  STUDENT_GROWTH_CHART: (id: string) => `/api/student/${id}/growth-chart`,
  STUDENT_TASKS: (id: string) => `/api/student/${id}/tasks`,
  STUDENT_TODAY_PLAN: (id: string) => `/api/student/${id}/today-plan`,
  STUDENT_COMPLETE_TASK: (id: string, taskId: string) => `/api/student/${id}/tasks/${taskId}/complete`,
  STUDENT_COMPLETE_TASK_EVIDENCE: (id: string, taskId: string) => `/api/student/${id}/tasks/${taskId}/complete-with-evidence`,
  STUDENT_REOPEN_TASK: (id: string, taskId: string) => `/api/student/${id}/tasks/${taskId}/reopen`,
  STUDENT_AI_TASK_SUGGESTIONS: (id: string) => `/api/student/${id}/ai-task-suggestions`,
  STUDENT_DELETE_TASK: (id: string, taskId: string) => `/api/student/${id}/today-plan/${taskId}`,
  STUDENT_GOALS: (id: string) => `/api/student/${id}/goals`,
  STUDENT_GOAL: (id: string, goalId: string) => `/api/student/${id}/goals/${goalId}`,
  STUDENT_OBSTACLES: (id: string) => `/api/student/${id}/obstacles`,
  STUDENT_OBSTACLE: (id: string, obstacleId: string) => `/api/student/${id}/obstacles/${obstacleId}`,
  STUDENT_OBSTACLE_TASK: (id: string, obstacleId: string) => `/api/student/${id}/obstacles/${obstacleId}/create-task`,
  STUDENT_BADGES: (id: string) => `/api/student/${id}/badges`,
  STUDENT_STICKER_BOARD: (id: string) => `/api/student/${id}/sticker-board`,
  STUDENT_SUMMARY: (id: string) => `/api/student/${id}/summary`,
  STUDENT_AVATAR: (id: string) => `/api/student/${id}/avatar/upload`,
  STUDENT_PROFILE_UPDATE: (id: string) => `/api/student/${id}/profile`,

  // AI
  AI_SUGGESTIONS: (id: string) => `/api/student/${id}/suggestions`,
  AI_GOAL_RECOMMENDATIONS: (id: string) => `/api/student/${id}/goal-recommendations`,

  // Teacher
  TEACHER_CLASS: (id: string) => `/api/teacher/${id}/class`,
  TEACHER_STUDENTS: `/api/students`,
  TEACHER_SUBMISSIONS: `/api/submissions`,
  TEACHER_CLASS_OBSTACLES: `/api/teacher/class-obstacles`,

  // Challenges
  CHALLENGE_RANDOM: '/api/challenge/random',
  CHALLENGE_SUBMIT: '/api/challenge/submit',
  CHALLENGE_SUMMARY: '/api/ai/summary',

  // Tasks
  TASKS: '/api/tasks',

  // Class Moments
  CLASS_MOMENTS: '/api/class/moments',
  CLASS_COMMENTS: (id: string) => `/api/class/moments/${id}/comments`,
  CLASS_LIKE: (id: string) => `/api/class/moments/${id}/like`,
  CLASS_UPLOAD_MEDIA: '/api/class/upload-media',
  CLASS_CLASSMATES: '/api/class/classmates',

  // Mood
  MOOD_SUBMIT: '/api/student/mood',
};
