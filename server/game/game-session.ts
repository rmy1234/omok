import type { GameState, Player } from '../types';

const BOARD_SIZE = 15;

export type AutoPlaceCallback = (row: number, col: number, color: 'black' | 'white') => void;

export class GameSession {
  private board: (string | null)[][];
  private currentTurn: 'black' | 'white';
  private blackPlayer: Player | null;
  private whitePlayer: Player | null;
  private winner: 'black' | 'white' | null;
  private moveHistory: { row: number; col: number; color: 'black' | 'white' }[];
  private turnStartTime: number | null;
  private turnTimer: NodeJS.Timeout | null;
  private autoPlaceCallback: AutoPlaceCallback | null;

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentTurn = 'black';
    this.blackPlayer = null;
    this.whitePlayer = null;
    this.winner = null;
    this.moveHistory = [];
    this.turnStartTime = null;
    this.turnTimer = null;
    this.autoPlaceCallback = null;
  }

  setAutoPlaceCallback(callback: AutoPlaceCallback | null): void {
    this.autoPlaceCallback = callback;
  }

  private createEmptyBoard(): (string | null)[][] {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
  }

  setPlayers(host: Player, guest: Player): void {
    // 랜덤으로 흑/백 배정
    if (Math.random() < 0.5) {
      this.blackPlayer = host;
      this.whitePlayer = guest;
    } else {
      this.blackPlayer = guest;
      this.whitePlayer = host;
    }
    
    // 게임 시작 시 타이머 시작
    this.startTurnTimer();
  }

  updatePlayerId(nickname: string, newId: string): void {
    if (this.blackPlayer?.nickname === nickname) {
      this.blackPlayer.id = newId;
    }
    if (this.whitePlayer?.nickname === nickname) {
      this.whitePlayer.id = newId;
    }
  }

  getState(): GameState {
    return {
      board: this.board.map(row => [...row]),
      currentTurn: this.currentTurn,
      blackPlayer: this.blackPlayer,
      whitePlayer: this.whitePlayer,
      winner: this.winner,
      moveHistory: [...this.moveHistory],
      turnStartTime: this.turnStartTime,
    };
  }

  getCurrentPlayerId(): string | null {
    if (this.currentTurn === 'black') {
      return this.blackPlayer?.id || null;
    }
    return this.whitePlayer?.id || null;
  }

  placeStone(row: number, col: number, playerId: string): boolean {
    // 유효성 검사
    if (this.winner) return false;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
    if (this.board[row][col] !== null) return false;
    if (this.getCurrentPlayerId() !== playerId) return false;

    // 타이머 정지
    this.stopTurnTimer();

    // 돌 놓기
    this.board[row][col] = this.currentTurn;
    this.moveHistory.push({ row, col, color: this.currentTurn });

    // 승리 체크
    if (this.checkWin(row, col, this.currentTurn)) {
      this.winner = this.currentTurn;
      return true;
    }

    // 턴 변경
    this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';
    
    // 새 턴 타이머 시작
    this.startTurnTimer();
    
    return true;
  }

  private startTurnTimer(): void {
    this.stopTurnTimer();
    this.turnStartTime = Date.now();
    
    const TURN_TIME_LIMIT = 30000; // 30초
    
    this.turnTimer = setTimeout(() => {
      this.autoPlaceStone();
    }, TURN_TIME_LIMIT);
  }

  private stopTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    // turnStartTime은 여기서 null로 설정하지 않음 - startTurnTimer에서 새로 설정됨
  }

  private autoPlaceStone(): void {
    if (this.winner) {
      this.stopTurnTimer();
      return;
    }

    // 빈 위치 찾기
    const emptyPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.board[row][col] === null) {
          emptyPositions.push({ row, col });
        }
      }
    }

    if (emptyPositions.length === 0) {
      this.stopTurnTimer();
      return;
    }

    // 랜덤하게 위치 선택
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const { row, col } = emptyPositions[randomIndex];
    const color = this.currentTurn;

    // 자동으로 돌 놓기
    this.board[row][col] = this.currentTurn;
    this.moveHistory.push({ row, col, color: this.currentTurn });

    // 승리 체크
    const isWin = this.checkWin(row, col, this.currentTurn);
    if (isWin) {
      this.winner = this.currentTurn;
      this.stopTurnTimer();
      
      // 콜백 호출 (승리 시)
      if (this.autoPlaceCallback) {
        this.autoPlaceCallback(row, col, color);
      }
      return;
    }

    // 턴 변경
    this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';
    
    // 새 턴 타이머 시작
    this.startTurnTimer();

    // 콜백 호출 (턴 변경 후에 호출해야 올바른 상태 전송)
    if (this.autoPlaceCallback) {
      this.autoPlaceCallback(row, col, color);
    }
  }

  getTimeRemaining(): number {
    if (!this.turnStartTime || !this.turnTimer) {
      return 30;
    }
    const elapsed = Date.now() - this.turnStartTime;
    const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
    return remaining;
  }

  private checkWin(row: number, col: number, color: string): boolean {
    const directions = [
      [0, 1],   // 가로
      [1, 0],   // 세로
      [1, 1],   // 대각선 \
      [1, -1],  // 대각선 /
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 정방향
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          this.board[newRow][newCol] === color
        ) {
          count++;
        } else {
          break;
        }
      }

      // 역방향
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          this.board[newRow][newCol] === color
        ) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) return true;
    }

    return false;
  }

  reset(): void {
    this.stopTurnTimer();
    this.board = this.createEmptyBoard();
    this.currentTurn = 'black';
    this.winner = null;
    this.moveHistory = [];
    
    // 흑/백 교체
    const temp = this.blackPlayer;
    this.blackPlayer = this.whitePlayer;
    this.whitePlayer = temp;
    
    // 타이머 시작
    this.startTurnTimer();
  }

  getWinner(): 'black' | 'white' | null {
    return this.winner;
  }

  setWinner(winner: 'black' | 'white'): void {
    this.winner = winner;
    this.stopTurnTimer();
  }
}

