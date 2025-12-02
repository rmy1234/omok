import type { GuestUser } from '../../../domain/entities/user';

export interface GuestLoginResult {
  success: boolean;
  user: GuestUser;
}

export class GuestLoginUseCase {
  execute(): GuestLoginResult {
    // 6자리 랜덤 숫자 생성
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const nickname = `게스트-${randomNumber}`;

    return {
      success: true,
      user: {
        nickname,
        isGuest: true,
      },
    };
  }
}

export const guestLoginUseCase = new GuestLoginUseCase();

