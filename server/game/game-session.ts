import type { GameState, Player } from '../types';

const BOARD_SIZE = 15;

export class GameSession {
  private board: (string | null)[][];
  private currentTurn: 'black' | 'white';
  private blackPlayer: Player | null;
  private whitePlayer: Player | null;
  private winner: 'black' | 'white' | null;
  private moveHistory: { row: number; col: number; color: 'black' | 'white' }[];

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentTurn = 'black';
    this.blackPlayer = null;
    this.whitePlayer = null;
    this.winner = null;
    this.moveHistory = [];
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
    return true;
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
    this.board = this.createEmptyBoard();
    this.currentTurn = 'black';
    this.winner = null;
    this.moveHistory = [];
    
    // 흑/백 교체
    const temp = this.blackPlayer;
    this.blackPlayer = this.whitePlayer;
    this.whitePlayer = temp;
  }

  getWinner(): 'black' | 'white' | null {
    return this.winner;
  }
}

