import { login as loginApi, type AuthResponse } from '../../../infrastructure/api/auth-api';

export interface LoginInput {
  username: string;
  password: string;
}

export class LoginUseCase {
  async execute(input: LoginInput): Promise<AuthResponse> {
    const { username, password } = input;

    // 클라이언트 측 유효성 검사
    if (!username || !password) {
      return { success: false, error: '아이디와 비밀번호를 입력해주세요.' };
    }

    // 백엔드 API 호출
    return loginApi(username, password);
  }
}

export const loginUseCase = new LoginUseCase();
