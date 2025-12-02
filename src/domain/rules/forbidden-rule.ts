import { Board } from '../entities/board';
import { Stone } from '../entities/stone';
import { Position } from '../value-objects/position';
import { StoneColor } from '../value-objects/stone-color';

export enum ForbiddenType {
  DOUBLE_THREE = 'DOUBLE_THREE', // 3-3
  DOUBLE_FOUR = 'DOUBLE_FOUR', // 4-4
  OVERLINE = 'OVERLINE', // 장목 (6개 이상)
}

export class ForbiddenRule {
  private readonly directions = [
    [0, 1], // 가로
    [1, 0], // 세로
    [1, 1], // 대각선 \
    [1, -1], // 대각선 /
  ];

  checkForbidden(
    board: Board,
    position: Position,
    color: StoneColor
  ): ForbiddenType | null {
    // 흑에게만 금수 규칙 적용
    if (color !== StoneColor.BLACK) {
      return null;
    }

    // 장목 체크 (6개 이상)
    if (this.checkOverline(board, position, color)) {
      return ForbiddenType.OVERLINE;
    }

    // 3-3 체크
    if (this.checkDoubleThree(board, position, color)) {
      return ForbiddenType.DOUBLE_THREE;
    }

    // 4-4 체크
    if (this.checkDoubleFour(board, position, color)) {
      return ForbiddenType.DOUBLE_FOUR;
    }

    return null;
  }

  private checkOverline(board: Board, position: Position, color: StoneColor): boolean {
    for (const [dx, dy] of this.directions) {
      const count = this.countConsecutive(board, position, color, dx, dy);
      if (count > 5) {
        return true;
      }
    }
    return false;
  }

  private checkDoubleThree(board: Board, position: Position, color: StoneColor): boolean {
    const testBoard = board.clone();
    testBoard.placeStone(new Stone(position, color));

    let openThreeCount = 0;

    for (const [dx, dy] of this.directions) {
      if (this.isOpenThree(testBoard, position, color, dx, dy)) {
        openThreeCount++;
      }
    }

    return openThreeCount >= 2;
  }

  private checkDoubleFour(board: Board, position: Position, color: StoneColor): boolean {
    const testBoard = board.clone();
    testBoard.placeStone(new Stone(position, color));

    let openFourCount = 0;

    for (const [dx, dy] of this.directions) {
      if (this.isOpenFour(testBoard, position, color, dx, dy)) {
        openFourCount++;
      }
    }

    return openFourCount >= 2;
  }

  private isOpenThree(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): boolean {
    const pattern = this.getPattern(board, position, color, dx, dy);
    // 열린 3: _XXX_ 또는 _XX_X_ 또는 _X_XX_
    return (
      pattern === '_XXX_' ||
      pattern === '_XX_X_' ||
      pattern === '_X_XX_'
    );
  }

  private isOpenFour(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): boolean {
    const pattern = this.getPattern(board, position, color, dx, dy);
    // 열린 4: _XXXX_
    return pattern === '_XXXX_';
  }

  private getPattern(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): string {
    let pattern = '';

    // 뒤쪽부터 앞쪽까지 패턴 생성
    for (let i = -5; i <= 5; i++) {
      const row = position.row + dx * i;
      const col = position.col + dy * i;

      if (row < 0 || row >= board.getSize() || col < 0 || col >= board.getSize()) {
        pattern += 'B'; // 경계
      } else {
        const stone = board.getStone(new Position(row, col));
        if (stone === color) {
          pattern += 'X';
        } else if (stone === StoneColor.EMPTY) {
          pattern += '_';
        } else {
          pattern += 'O'; // 상대방 돌
        }
      }
    }

    return pattern;
  }

  private countConsecutive(
    board: Board,
    position: Position,
    color: StoneColor,
    dx: number,
    dy: number
  ): number {
    let count = 1;

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

