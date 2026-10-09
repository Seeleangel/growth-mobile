import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STORAGE_KEYS = {
  USER: '@pregrow_user',
  USER_ROLE: '@pregrow_user_role',
  ONBOARDING_COMPLETED: '@pregrow_onboarding_completed',
  CHALLENGE_PROGRESS: '@pregrow_challenge_progress',
  CHALLENGE_ANSWERS: '@pregrow_challenge_answers',
} as const;

// Storage Service
export const storageService = {
  // User
  getUser: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  },

  setUser: async (user: object) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user in storage:', error);
    }
  },

  removeUser: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  },

  // User Role
  getUserRole: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      console.error('Error getting user role from storage:', error);
      return null;
    }
  },

  setUserRole: async (role: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    } catch (error) {
      console.error('Error setting user role in storage:', error);
    }
  },

  // Onboarding
  getOnboardingCompleted: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  },

  setOnboardingCompleted: async (completed: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  // Challenge Progress
  getChallengeProgress: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_PROGRESS);
      return json ? JSON.parse(json) : { count: 0, answers: [] };
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      return { count: 0, answers: [] };
    }
  },

  setChallengeProgress: async (progress: { count: number; answers: any[] }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Error setting challenge progress:', error);
    }
  },

  clearChallengeProgress: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CHALLENGE_PROGRESS);
    } catch (error) {
      console.error('Error clearing challenge progress:', error);
    }
  },

  // Clear all storage
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
