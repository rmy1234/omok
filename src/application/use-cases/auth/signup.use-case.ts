import { signup as signupApi, type AuthResponse } from '../../../infrastructure/api/auth-api';

export interface SignupInput {
  username: string;
  nickname: string;
  password: string;
}

export class SignupUseCase {
  async execute(input: SignupInput): Promise<AuthResponse> {
    const { username, nickname, password } = input;

    // 클라이언트 측 유효성 검사
    if (!username || username.length < 4) {
      return { success: false, error: '아이디는 4자 이상이어야 합니다.' };
    }

    if (!nickname || nickname.length < 2) {
      return { success: false, error: '닉네임은 2자 이상이어야 합니다.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: '비밀번호는 6자 이상이어야 합니다.' };
    }

    // 백엔드 API 호출
    return signupApi(username, nickname, password);
  }
}

export const signupUseCase = new SignupUseCase();
