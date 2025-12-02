// 사용자 관련 타입 정의

export interface UserPublic {
  id: number;
  username: string;
  nickname: string;
  createdAt: string;
}

export interface GuestUser {
  nickname: string;
  isGuest: true;
}

export type CurrentUser = UserPublic | GuestUser;
