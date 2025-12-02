import { GameState, GameStatus } from '../../domain/entities/game-state';
import { Stone } from '../../domain/entities/stone';
import { ForbiddenRule, ForbiddenType } from '../../domain/rules/forbidden-rule';
import { WinRule } from '../../domain/rules/win-rule';
import { Position } from '../../domain/value-objects/position';
import { StoneColor } from '../../domain/value-objects/stone-color';

export interface PlaceStoneResult {
  success: boolean;
  newGameState: GameState | null;
  error?: string;
  forbiddenType?: ForbiddenType;
}

export class PlaceStoneUseCase {
  constructor(
    private readonly winRule: WinRule,
    private readonly forbiddenRule: ForbiddenRule
  ) {}

  execute(
    currentGameState: GameState,
    position: Position
  ): PlaceStoneResult {
    // 게임이 종료되었는지 확인
    if (currentGameState.isGameOver()) {
      return {
        success: false,
        newGameState: null,
        error: '게임이 이미 종료되었습니다.',
      };
    }

    // 위치가 비어있는지 확인
    if (!currentGameState.board.isEmpty(position)) {
      return {
        success: false,
        newGameState: null,
        error: '이미 돌이 놓인 위치입니다.',
      };
    }

    const currentPlayer = currentGameState.currentPlayer;

    // 금수 규칙 체크 (흑에게만 적용)
    const forbiddenType = this.forbiddenRule.checkForbidden(
      currentGameState.board,
      position,
      currentPlayer
    );

    if (forbiddenType) {
      return {
        success: false,
        newGameState: null,
        error: this.getForbiddenErrorMessage(forbiddenType),
        forbiddenType,
      };
    }

    // 돌 놓기
    const newBoard = currentGameState.board.clone();
    const stone = new Stone(position, currentPlayer);
    newBoard.placeStone(stone);

    // 승리 체크
    const isWin = this.winRule.checkWin(newBoard, position, currentPlayer);

    let newStatus: GameStatus;
    if (isWin) {
      newStatus =
        currentPlayer === StoneColor.BLACK
          ? GameStatus.BLACK_WIN
          : GameStatus.WHITE_WIN;
    } else {
      newStatus = GameStatus.IN_PROGRESS;
    }

    const newGameState = new GameState(
      newBoard,
      currentGameState.getNextPlayer(),
      newStatus,
      currentGameState.moveHistory + 1
    );

    return {
      success: true,
      newGameState,
    };
  }

  private getForbiddenErrorMessage(forbiddenType: ForbiddenType): string {
    switch (forbiddenType) {
      case ForbiddenType.DOUBLE_THREE:
        return '3-3 금수입니다.';
      case ForbiddenType.DOUBLE_FOUR:
        return '4-4 금수입니다.';
      case ForbiddenType.OVERLINE:
        return '장목 금수입니다.';
      default:
        return '금수 위치입니다.';
    }
  }
}

