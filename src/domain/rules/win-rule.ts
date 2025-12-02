import { Board } from '../entities/board';
import { Position } from '../value-objects/position';
import { StoneColor } from '../value-objects/stone-color';

export class WinRule {
  private readonly directions = [
    [0, 1], // 가로
    [1, 0], // 세로
    [1, 1], // 대각선 \
    [1, -1], // 대각선 /
  ];

  checkWin(board: Board, position: Position, color: StoneColor): boolean {
    for (const [dx, dy] of this.directions) {
      if (this.countConsecutive(board, position, color, dx, dy) >= 5) {
        return true;
      }
    }
    return false;
  }

  private countConsecutive(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): number {
    let count = 1; // 현재 위치 포함

    // 양방향으로 카운트
    count += this.countInDirection(board, position, color, dx, dy);
    count += this.countInDirection(board, position, color, -dx, -dy);

    return count;
  }

  private countInDirection(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): number {
    let count = 0;
    let row = position.row + dx;
    let col = position.col + dy;

    while (
      row >= 0 &&
      row < board.getSize() &&
      col >= 0 &&
      col < board.getSize() &&
      board.getStone(new Position(row, col)) === color
    ) {
      count++;
      row += dx;
      col += dy;
    }

    return count;
  }
}




