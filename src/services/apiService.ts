import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { User, ApiResponse } from '../api/types';

// API Service
export const apiService = {
  // Auth
  register: async (data: { email: string; password: string; full_name: string; role: 'student' | 'teacher' }) => {
    const response = await apiClient.post(ENDPOINTS.REGISTER, data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await apiClient.post(ENDPOINTS.LOGIN, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Student
  getStudentStats: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_STATS(id));
    return response.data;
  },

  getStudentCheckinStatus: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_CHECKIN_STATUS(id));
    return response.data;
  },

  submitCheckin: async (id: string) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_CHECKIN(id));
    return response.data;
  },

  getGrowthStats: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_GROWTH_STATS(id));
    return response.data;
  },

  getGrowthChart: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_GROWTH_CHART(id));
    return response.data;
  },

  getStudentTasks: async (id: string, limit = 100) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_TASKS(id), { params: { limit } });
    return response.data;
  },

  createTodayPlan: async (id: string, data: { task_ids?: string[]; title?: string; description?: string }) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_TODAY_PLAN(id), data);
    return response.data;
  },

  completeTask: async (id: string, taskId: string) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_COMPLETE_TASK(id, taskId));
    return response.data;
  },

  completeTaskWithEvidence: async (id: string, taskId: string, imageBase64: string, mimeType = 'image/jpeg') => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_COMPLETE_TASK_EVIDENCE(id, taskId), { imageBase64, mimeType });
    return response.data;
  },

  getAiTaskSuggestions: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_AI_TASK_SUGGESTIONS(id), { timeout: 20000 });
    return response.data as { dream: string; tasks: Array<{ title: string; description: string }> };
  },

  reopenTask: async (id: string, taskId: string) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_REOPEN_TASK(id, taskId));
    return response.data;
  },

  deleteTask: async (id: string, taskId: string) => {
    const response = await apiClient.delete(ENDPOINTS.STUDENT_DELETE_TASK(id, taskId));
    return response.data;
  },

  getGoals: async (id: string, dreamTag?: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_GOALS(id), { params: { dream_tag: dreamTag } });
    return response.data;
  },

  createGoal: async (id: string, data: { title: string; description?: string; target_date?: string; dream_tag?: string }) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_GOALS(id), data);
    return response.data;
  },

  updateGoal: async (id: string, goalId: string, data: any) => {
    const response = await apiClient.patch(ENDPOINTS.STUDENT_GOAL(id, goalId), data);
    return response.data;
  },

  deleteGoal: async (id: string, goalId: string) => {
    const response = await apiClient.delete(ENDPOINTS.STUDENT_GOAL(id, goalId));
    return response.data;
  },

  getObstacles: async (id: string, dreamFocus?: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_OBSTACLES(id), { params: { dream_focus: dreamFocus } });
    return response.data;
  },

  createObstacle: async (id: string, data: { content: string; obstacle_type: string; severity?: number; dream_tag?: string }) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_OBSTACLES(id), data);
    return response.data;
  },

  updateObstacle: async (id: string, obstacleId: string, data: any) => {
    const response = await apiClient.patch(ENDPOINTS.STUDENT_OBSTACLE(id, obstacleId), data);
    return response.data;
  },

  deleteObstacle: async (id: string, obstacleId: string) => {
    const response = await apiClient.delete(ENDPOINTS.STUDENT_OBSTACLE(id, obstacleId));
    return response.data;
  },

  createObstacleTask: async (id: string, obstacleId: string) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_OBSTACLE_TASK(id, obstacleId));
    return response.data;
  },

  getBadges: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_BADGES(id));
    return response.data;
  },

  getStickerBoard: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_STICKER_BOARD(id));
    return response.data;
  },

  getStudentSummary: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.STUDENT_SUMMARY(id));
    return response.data;
  },

  uploadAvatar: async (id: string, data: { fileName: string; mimeType: string; dataBase64: string }) => {
    const response = await apiClient.post(ENDPOINTS.STUDENT_AVATAR(id), data);
    return response.data;
  },

  updateProfile: async (id: string, data: { full_name?: string; bio?: string; dream?: string }) => {
    const response = await apiClient.patch(ENDPOINTS.STUDENT_PROFILE_UPDATE(id), data);
    return response.data;
  },

  // AI (longer timeout for external API calls)
  getAISuggestions: async (id: string, dreamFocus?: string) => {
    const response = await apiClient.get(ENDPOINTS.AI_SUGGESTIONS(id), {
      params: { dream_focus: dreamFocus },
      timeout: 20000,
    });
    return response.data;
  },

  getGoalRecommendations: async (id: string, dreamFocus?: string, count = 3) => {
    const response = await apiClient.get(ENDPOINTS.AI_GOAL_RECOMMENDATIONS(id), {
      params: { dream_focus: dreamFocus, count },
      timeout: 20000,
    });
    return response.data;
  },

  // Teacher
  getTeacherClass: async (id: string) => {
    const response = await apiClient.get(ENDPOINTS.TEACHER_CLASS(id));
    return response.data;
  },

  getTeacherStudents: async (teacherId: string, className?: string) => {
    const response = await apiClient.get(ENDPOINTS.TEACHER_STUDENTS, {
      params: { teacher_id: teacherId, class_name: className },
    });
    return response.data;
  },

  getTeacherSubmissions: async (teacherId: string, days = 7) => {
    const response = await apiClient.get(ENDPOINTS.TEACHER_SUBMISSIONS, {
      params: { teacher_id: teacherId, days },
    });
    return response.data;
  },

  getClassObstaclesSummary: async (teacherId: string, days = 7) => {
    const response = await apiClient.get(ENDPOINTS.TEACHER_CLASS_OBSTACLES, {
      params: { teacher_id: teacherId, days },
    });
    return response.data;
  },

  // Challenges
  getRandomChallenge: async (category?: string, exclude?: string[]) => {
    const response = await apiClient.get(ENDPOINTS.CHALLENGE_RANDOM, {
      params: { category, exclude: exclude?.join(',') },
    });
    return response.data;
  },

  submitChallenge: async (data: { student_id: string; challenge_id: string; option_selected: string; type: string }) => {
    const response = await apiClient.post(ENDPOINTS.CHALLENGE_SUBMIT, data);
    return response.data;
  },

  getChallengeSummary: async (data: { challenge_title: string; selected_option: string; is_positive: boolean; student_id: string }) => {
    const response = await apiClient.post(ENDPOINTS.CHALLENGE_SUMMARY, data);
    return response.data;
  },

  // Tasks
  getTasks: async (studentId?: string, limit = 100) => {
    const response = await apiClient.get(ENDPOINTS.TASKS, {
      params: { student_id: studentId, limit },
    });
    return response.data;
  },

  // Class Moments
  getMoments: async (userId: string, limit = 20) => {
    const response = await apiClient.get(ENDPOINTS.CLASS_MOMENTS, {
      params: { user_id: userId, limit },
    });
    return response.data;
  },

  createMoment: async (data: { student_id: string; content?: string; type?: string; media_url?: string }) => {
    const response = await apiClient.post(ENDPOINTS.CLASS_MOMENTS, data);
    return response.data;
  },

  uploadMomentMedia: async (data: { fileName: string; mimeType: string; dataBase64: string }) => {
    const response = await apiClient.post(ENDPOINTS.CLASS_UPLOAD_MEDIA, data);
    return response.data;
  },

  toggleLike: async (momentId: string, studentId: string) => {
    const response = await apiClient.post(ENDPOINTS.CLASS_LIKE(momentId), { student_id: studentId });
    return response.data;
  },

  getComments: async (momentId: string) => {
    const response = await apiClient.get(ENDPOINTS.CLASS_COMMENTS(momentId));
    return response.data;
  },

  createComment: async (momentId: string, data: { student_id: string; content: string }) => {
    const response = await apiClient.post(ENDPOINTS.CLASS_COMMENTS(momentId), data);
    return response.data;
  },

  getClassmates: async (userId: string) => {
    const response = await apiClient.get(ENDPOINTS.CLASS_CLASSMATES, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Mood
  submitMood: async (data: { student_id: string; mood: string; note?: string }) => {
    const response = await apiClient.post(ENDPOINTS.MOOD_SUBMIT, data);
    return response.data;
  },
};
