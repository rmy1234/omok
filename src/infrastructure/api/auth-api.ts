import type { UserPublic } from '../../domain/entities/user';

// 현재 접속 호스트 기반으로 API URL 동적 설정
const getApiUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api/auth`;
};

const API_URL = getApiUrl();

export interface AuthResponse {
  success: boolean;
  user?: UserPublic;
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
