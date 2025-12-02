import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 데이터베이스 파일 경로
const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // data 폴더 생성 (없으면)
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 데이터베이스 연결
  db = new Database(DB_PATH);
  
  // WAL 모드 활성화 (성능 향상)
  db.pragma('journal_mode = WAL');

  // 테이블 생성
  createTables(db);

  console.log('✅ SQLite 데이터베이스 연결 성공');
  console.log(`   경로: ${DB_PATH}`);
  
  return db;
}

function createTables(database: Database.Database): void {
  // users 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 기존 테이블에 컬럼 추가 (마이그레이션)
  try {
    database.exec(`ALTER TABLE users ADD COLUMN wins INTEGER DEFAULT 0`);
  } catch (e) {
    // 컬럼이 이미 존재하면 무시
  }
  try {
    database.exec(`ALTER TABLE users ADD COLUMN draws INTEGER DEFAULT 0`);
  } catch (e) {
    // 컬럼이 이미 존재하면 무시
  }
  try {
    database.exec(`ALTER TABLE users ADD COLUMN losses INTEGER DEFAULT 0`);
  } catch (e) {
    // 컬럼이 이미 존재하면 무시
  }

  // 인덱스 생성
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('데이터베이스가 초기화되지 않았습니다. initDatabase()를 먼저 호출하세요.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('SQLite 데이터베이스 연결 종료');
  }
}

