import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AppStore {
  currentPage: 'know-exam' | 'explore-college' | 'best-college-for-you';
  selectedExam: string;
  selectedCollege: string;
  chatHistory: Array<{ role: 'user' | 'bot'; content: string }>;
  setCurrentPage: (page: 'know-exam' | 'explore-college' | 'best-college-for-you') => void;
  setSelectedExam: (exam: string) => void;
  setSelectedCollege: (college: string) => void;
  addChatMessage: (role: 'user' | 'bot', content: string) => void;
  clearChat: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({
        user: {
          id: '1',
          name: 'Student',
          email: email,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({
        user: {
          id: '1',
          name: name,
          email: email,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'know-exam',
  selectedExam: 'JEE',
  selectedCollege: '',
  chatHistory: [],
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedExam: (exam) => set({ selectedExam: exam }),
  setSelectedCollege: (college) => set({ selectedCollege: college }),
  addChatMessage: (role, content) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, { role, content }],
    })),
  clearChat: () => set({ chatHistory: [] }),
}));
