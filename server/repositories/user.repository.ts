import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/sqlite';

export interface User {
  id: number;
  username: string;
  nickname: string;
  password_hash: string;
  wins: number;
  draws: number;
  losses: number;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  nickname: string;
  createdAt: string;
}

export interface GameStats {
  wins: number;
  draws: number;
  losses: number;
  totalGames: number;
  winRate: number;
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

  // 전적 조회
  getStats(userId: number): GameStats {
    const db = getDatabase();
    const user = db.prepare('SELECT wins, draws, losses FROM users WHERE id = ?').get(userId) as { wins: number; draws: number; losses: number } | undefined;
    
    if (!user) {
      return { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 };
    }

    const totalGames = user.wins + user.draws + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

    return {
      wins: user.wins,
      draws: user.draws,
      losses: user.losses,
      totalGames,
      winRate,
    };
  }

  // 닉네임으로 전적 조회
  getStatsByNickname(nickname: string): GameStats | null {
    const user = this.findByNickname(nickname);
    if (!user) return null;
    return this.getStats(user.id);
  }

  // 승리 기록
  recordWinByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET wins = wins + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }

  // 패배 기록
  recordLossByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET losses = losses + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }

  // 무승부 기록
  recordDrawByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET draws = draws + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }
}

export const userRepository = new UserRepository();
