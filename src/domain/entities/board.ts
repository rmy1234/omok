import { Position } from '../value-objects/position';
import { StoneColor } from '../value-objects/stone-color';
import { Stone } from './stone';

export class Board {
  private readonly grid: StoneColor[][];
  private readonly size: number = 15;

  constructor() {
    this.grid = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(StoneColor.EMPTY));
  }

  getSize(): number {
    return this.size;
  }

  getStone(position: Position): StoneColor {
    return this.grid[position.row][position.col];
  }

  placeStone(stone: Stone): void {
    if (this.getStone(stone.position) !== StoneColor.EMPTY) {
      throw new Error('Position is already occupied');
    }
    this.grid[stone.position.row][stone.position.col] = stone.color;
  }

  removeStone(position: Position): void {
    this.grid[position.row][position.col] = StoneColor.EMPTY;
  }

  isEmpty(position: Position): boolean {
    return this.getStone(position) === StoneColor.EMPTY;
  }

  getGrid(): StoneColor[][] {
    return this.grid.map((row) => [...row]);
  }

  clone(): Board {
    const newBoard = new Board();
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const position = new Position(row, col);
        const color = this.getStone(position);
        if (color !== StoneColor.EMPTY) {
          newBoard.placeStone(new Stone(position, color));
        }
      }
    }
    return newBoard;
  }

  // 직렬화를 위한 메서드
  toJSON(): string[][] {
    return this.grid.map(row => row.map(cell => cell));
  }

  // 역직렬화를 위한 정적 메서드
  static fromJSON(data: string[][]): Board {
    const board = new Board();
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const color = data[row][col] as StoneColor;
        if (color !== StoneColor.EMPTY) {
          board.placeStone(new Stone(new Position(row, col), color));
        }
      }
    }
    return board;
  }
}




