import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/sqlite';
import { calculateRank, type RankTier, type RankInfo } from '../utils/rank';

export interface User {
  id: number;
  username: string;
  nickname: string;
  password_hash: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
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
  points: number;
  rank?: RankTier;
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

  // 전적 조회 (매번 DB에서 직접 조회)
  getStats(userId: number): GameStats {
    const db = getDatabase();
    // WAL 체크포인트 강제 실행하여 최신 데이터 보장
    db.pragma('wal_checkpoint(PASSIVE)');
    const user = db.prepare('SELECT wins, draws, losses, points FROM users WHERE id = ?').get(userId) as { wins: number; draws: number; losses: number; points: number } | undefined;
    
    if (!user) {
      return { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0, points: 50, rank: 'BRONZE' };
    }

    const totalGames = user.wins + user.draws + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
    const points = user.points ?? 0; // 기본값 0
    const rankInfo = calculateRank(points);

    return {
      wins: user.wins,
      draws: user.draws,
      losses: user.losses,
      totalGames,
      winRate,
      points,
      rank: rankInfo?.tier,
    };
  }

  // 닉네임으로 전적 조회 (DB에서 직접 조회)
  getStatsByNickname(nickname: string): GameStats | null {
    const db = getDatabase();
    // WAL 체크포인트 강제 실행하여 최신 데이터 보장
    db.pragma('wal_checkpoint(PASSIVE)');
    const user = db.prepare('SELECT id, wins, draws, losses, points FROM users WHERE nickname = ?').get(nickname) as { id: number; wins: number; draws: number; losses: number; points: number } | undefined;
    
    if (!user) return null;
    
    const totalGames = user.wins + user.draws + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
    const points = user.points ?? 0; // 기본값 0
    const rankInfo = calculateRank(points);

    return {
      wins: user.wins,
      draws: user.draws,
      losses: user.losses,
      totalGames,
      winRate,
      points,
      rank: rankInfo?.tier,
    };
  }

  // 승리 기록 (랭크게임)
  recordWinByNickname(nickname: string, pointsChange: number): boolean {
    const db = getDatabase();
    const currentUser = db.prepare('SELECT points FROM users WHERE nickname = ?').get(nickname) as { points: number } | undefined;
    const currentPoints = currentUser?.points ?? 0;
    const newPoints = Math.max(0, currentPoints + pointsChange);
    const result = db.prepare('UPDATE users SET wins = wins + 1, points = ? WHERE nickname = ?').run(newPoints, nickname);
    return result.changes > 0;
  }

  // 패배 기록 (랭크게임)
  recordLossByNickname(nickname: string, pointsChange: number): boolean {
    const db = getDatabase();
    const currentUser = db.prepare('SELECT points FROM users WHERE nickname = ?').get(nickname) as { points: number } | undefined;
    const currentPoints = currentUser?.points ?? 0;
    const newPoints = Math.max(0, currentPoints + pointsChange);
    const result = db.prepare('UPDATE users SET losses = losses + 1, points = ? WHERE nickname = ?').run(newPoints, nickname);
    return result.changes > 0;
  }

  // 무승부 기록 (랭크게임)
  recordDrawByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET draws = draws + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }

  // 친선게임 승리 기록 (포인트 변화 없음)
  recordFriendlyWinByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET wins = wins + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }

  // 친선게임 패배 기록 (포인트 변화 없음)
  recordFriendlyLossByNickname(nickname: string): boolean {
    const db = getDatabase();
    const result = db.prepare('UPDATE users SET losses = losses + 1 WHERE nickname = ?').run(nickname);
    return result.changes > 0;
  }

  // 전체 랭킹 조회 (랭크 순, 같으면 승률 순, 같으면 전적 순)
  getRankings(): Array<{ nickname: string; stats: GameStats; rank: number }> {
    const db = getDatabase();
    // WAL 체크포인트 강제 실행하여 최신 데이터 보장
    db.pragma('wal_checkpoint(PASSIVE)');
    const users = db.prepare(`
      SELECT nickname, wins, draws, losses, points,
             (wins + draws + losses) as totalGames,
             CASE WHEN (wins + draws + losses) > 0 
                  THEN ROUND((wins * 100.0 / (wins + draws + losses)), 0)
                  ELSE 0 END as winRate
      FROM users
    `).all() as Array<{
      nickname: string;
      wins: number;
      draws: number;
      losses: number;
      points: number;
      totalGames: number;
      winRate: number;
    }>;

    // 각 유저의 랭크 계산 및 정렬
    const rankings = users.map((user) => {
      const points = user.points ?? 0;
      const rankInfo = calculateRank(points);
      return {
        nickname: user.nickname,
        stats: {
          wins: user.wins,
          draws: user.draws,
          losses: user.losses,
          totalGames: user.totalGames,
          winRate: user.winRate,
          points: points,
          rank: rankInfo?.tier,
        },
        rankInfo,
      };
    });

    // 랭크 순서로 정렬 (랭크 없는 경우 맨 뒤, 같으면 포인트 순, 같으면 승률 순)
    rankings.sort((a, b) => {
      // 랭크가 없는 경우 (null) 맨 뒤로
      if (!a.rankInfo && !b.rankInfo) {
        if (a.stats.points !== b.stats.points) {
          return b.stats.points - a.stats.points;
        }
        if (a.stats.winRate !== b.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        return b.stats.totalGames - a.stats.totalGames;
      }
      if (!a.rankInfo) return 1; // a가 랭크 없으면 뒤로
      if (!b.rankInfo) return -1; // b가 랭크 없으면 뒤로
      
      if (a.rankInfo.order !== b.rankInfo.order) {
        return a.rankInfo.order - b.rankInfo.order;
      }
      if (a.stats.points !== b.stats.points) {
        return b.stats.points - a.stats.points;
      }
      if (a.stats.winRate !== b.stats.winRate) {
        return b.stats.winRate - a.stats.winRate;
      }
      return b.stats.totalGames - a.stats.totalGames;
    });

    // 순위 번호 부여
    return rankings.map((entry, index) => ({
      nickname: entry.nickname,
      stats: entry.stats,
      rank: index + 1,
    }));
  }
}

export const userRepository = new UserRepository();
