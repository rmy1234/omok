import type { UserPublic } from '../../domain/entities/user';

// 배포 시 VITE_API_URL 사용, 없으면 현재 호스트:3001/api/auth (로컬/동일 도메인)
const getApiUrl = (): string => {
  if (typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api/auth`;
};

const API_URL = getApiUrl();

export type RankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHALLENGER';

export interface GameStats {
  wins: number;
  draws: number;
  losses: number;
  totalGames: number;
  winRate: number;
  points: number;
  rank?: RankTier;
}

export interface AuthResponse {
  success: boolean;
  user?: UserPublic;
  stats?: GameStats;
  error?: string;
}

export async function signup(
  username: string,
  nickname: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, nickname, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: '서버에 연결할 수 없습니다.' };
  }
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: '서버에 연결할 수 없습니다.' };
  }
}

export async function getStats(nickname: string): Promise<{ success: boolean; stats?: GameStats; error?: string }> {
  try {
    // 캐시 방지를 위해 타임스탬프 추가
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/stats/${encodeURIComponent(nickname)}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: '서버에 연결할 수 없습니다.' };
  }
}

export interface RankingEntry {
  nickname: string;
  stats: GameStats;
  rank: number;
}

export async function getRankings(): Promise<{ success: boolean; rankings?: RankingEntry[]; error?: string }> {
  try {
    // 캐시 방지를 위해 타임스탬프 추가
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/rankings?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: '서버에 연결할 수 없습니다.' };
  }
}
