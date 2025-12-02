import { Board } from './board';
import { StoneColor } from '../value-objects/stone-color';

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  BLACK_WIN = 'BLACK_WIN',
  WHITE_WIN = 'WHITE_WIN',
  DRAW = 'DRAW',
}

export class GameState {
  constructor(
    public readonly board: Board,
    public readonly currentPlayer: StoneColor,
    public readonly status: GameStatus,
    public readonly moveHistory: number = 0
  ) {}

  isGameOver(): boolean {
    return (
      this.status === GameStatus.BLACK_WIN ||
      this.status === GameStatus.WHITE_WIN ||
      this.status === GameStatus.DRAW
    );
  }

  getNextPlayer(): StoneColor {
    return this.currentPlayer === StoneColor.BLACK
      ? StoneColor.WHITE
      : StoneColor.BLACK;
  }
}




