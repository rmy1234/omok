import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/sqlite';

export interface User {
  id: number;
  username: string;
  nickname: string;
  password_hash: string;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  nickname: string;
  createdAt: string;
}

class UserRepository {
  findByUsername(username: string): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }

  findByNickname(nickname: string): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE nickname = ?');
    return stmt.get(nickname) as User | undefined;
  }

  async create(username: string, nickname: string, password: string): Promise<UserPublic | null> {
    const db = getDatabase();
    
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      const stmt = db.prepare(`
        INSERT INTO users (username, nickname, password_hash)
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(username, nickname, passwordHash);
      
      if (!result.lastInsertRowid) {
        return null;
      }

      return {
        id: Number(result.lastInsertRowid),
        username,
        nickname,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      return null;
    }
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      createdAt: user.created_at,
    };
  }
}

export const userRepository = new UserRepository();
