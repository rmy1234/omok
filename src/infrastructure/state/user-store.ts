import { create } from 'zustand';
import type { CurrentUser, UserPublic, GuestUser } from '../../domain/entities/user';

const STORAGE_KEY = 'game_user';

interface UserState {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // 액션
  setUser: (user: UserPublic) => void;
  setGuestUser: (user: GuestUser) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

// sessionStorage에서 사용자 정보 불러오기
function loadUserFromStorage(): { user: CurrentUser | null; isGuest: boolean } {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return { user: data.user, isGuest: data.isGuest };
    }
  } catch (error) {
    console.error('Failed to load user from storage:', error);
  }
  return { user: null, isGuest: false };
}

// sessionStorage에 사용자 정보 저장
function saveUserToStorage(user: CurrentUser, isGuest: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isGuest }));
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

export const useUserStore = create<UserState>((set) => ({
  currentUser: initialState.user,
  isAuthenticated: initialState.user !== null,
  isGuest: initialState.isGuest,

  setUser: (user: UserPublic) => {
    saveUserToStorage(user, false);
    set({
      currentUser: user,
      isAuthenticated: true,
      isGuest: false,
    });
  },

  setGuestUser: (user: GuestUser) => {
    saveUserToStorage(user, true);
    set({
      currentUser: user,
      isAuthenticated: true,
      isGuest: true,
    });
  },

  logout: () => {
    removeUserFromStorage();
    set({
      currentUser: null,
      isAuthenticated: false,
      isGuest: false,
    });
  },

  loadFromStorage: () => {
    const { user, isGuest } = loadUserFromStorage();
    set({
      currentUser: user,
      isAuthenticated: user !== null,
      isGuest,
    });
  },
}));
