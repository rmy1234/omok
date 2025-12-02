import { create } from 'zustand';
import type { CurrentUser, UserPublic, GuestUser } from '../../domain/entities/user';
import type { GameStats } from '../api/auth-api';

const STORAGE_KEY = 'game_user';

interface UserState {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  stats: GameStats | null;
  
  // 액션
  setUser: (user: UserPublic, stats?: GameStats) => void;
  setGuestUser: (user: GuestUser) => void;
  setStats: (stats: GameStats) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

// sessionStorage에서 사용자 정보 불러오기
function loadUserFromStorage(): { user: CurrentUser | null; isGuest: boolean; stats: GameStats | null } {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return { user: data.user, isGuest: data.isGuest, stats: data.stats || null };
    }
  } catch (error) {
    console.error('Failed to load user from storage:', error);
  }
  return { user: null, isGuest: false, stats: null };
}

// sessionStorage에 사용자 정보 저장
function saveUserToStorage(user: CurrentUser, isGuest: boolean, stats: GameStats | null = null): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isGuest, stats }));
  } catch (error) {
    console.error('Failed to save user to storage:', error);
  }
}

// sessionStorage에서 사용자 정보 삭제
function removeUserFromStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove user from storage:', error);
  }
}

// 초기 상태 로드
const initialState = loadUserFromStorage();

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: initialState.user,
  isAuthenticated: initialState.user !== null,
  isGuest: initialState.isGuest,
  stats: initialState.stats,

  setUser: (user: UserPublic, stats?: GameStats) => {
    saveUserToStorage(user, false, stats || null);
    set({
      currentUser: user,
      isAuthenticated: true,
      isGuest: false,
      stats: stats || null,
    });
  },

  setGuestUser: (user: GuestUser) => {
    saveUserToStorage(user, true, null);
    set({
      currentUser: user,
      isAuthenticated: true,
      isGuest: true,
      stats: null,
    });
  },

  setStats: (stats: GameStats) => {
    const { currentUser, isGuest } = get();
    if (currentUser) {
      saveUserToStorage(currentUser, isGuest, stats);
    }
    set({ stats });
  },

  logout: () => {
    removeUserFromStorage();
    set({
      currentUser: null,
      isAuthenticated: false,
      isGuest: false,
      stats: null,
    });
  },

  loadFromStorage: () => {
    const { user, isGuest, stats } = loadUserFromStorage();
    set({
      currentUser: user,
      isAuthenticated: user !== null,
      isGuest,
      stats,
    });
  },
}));
