import { GameState, GameStatus } from '../../domain/entities/game-state';
import { Stone } from '../../domain/entities/stone';
import { ForbiddenRule } from '../../domain/rules/forbidden-rule';
import { WinRule } from '../../domain/rules/win-rule';
import { Position } from '../../domain/value-objects/position';
import { StoneColor } from '../../domain/value-objects/stone-color';
import type { PlaceStoneResult } from './place-stone.use-case';

export class AutoPlaceStoneUseCase {
  constructor(
    private readonly winRule: WinRule,
    private readonly forbiddenRule: ForbiddenRule
  ) {}

  execute(currentGameState: GameState): PlaceStoneResult {
    // 게임이 종료되었는지 확인
    if (currentGameState.isGameOver()) {
      return {
        success: false,
        newGameState: null,
        error: '게임이 이미 종료되었습니다.',
      };
    }

    // 빈 위치 찾기
    const emptyPositions: Position[] = [];
    for (let row = 0; row < currentGameState.board.getSize(); row++) {
      for (let col = 0; col < currentGameState.board.getSize(); col++) {
        const position = new Position(row, col);
        if (currentGameState.board.isEmpty(position)) {
          emptyPositions.push(position);
        }
      }
    }

    if (emptyPositions.length === 0) {
      return {
        success: false,
        newGameState: null,
        error: '놓을 수 있는 위치가 없습니다.',
      };
    }

    // 랜덤하게 위치 선택 (금수 규칙을 피하기 위해 여러 번 시도)
    const currentPlayer = currentGameState.currentPlayer;
    let selectedPosition: Position | null = null;

    // 먼저 금수가 아닌 위치를 찾기
    const validPositions = emptyPositions.filter((pos) => {
      const forbiddenType = this.forbiddenRule.checkForbidden(
        currentGameState.board,
        pos,
        currentPlayer
      );
      return forbiddenType === null;
    });

    // 금수가 아닌 위치가 있으면 그 중에서 선택, 없으면 모든 빈 위치 중에서 선택
    const candidates = validPositions.length > 0 ? validPositions : emptyPositions;
    selectedPosition = candidates[Math.floor(Math.random() * candidates.length)];

    if (!selectedPosition) {
      // 마지막 수단으로 첫 번째 빈 위치 선택
      selectedPosition = emptyPositions[0];
    }

    // 선택된 위치에 돌 놓기
    const newBoard = currentGameState.board.clone();
    const stone = new Stone(selectedPosition, currentPlayer);
    newBoard.placeStone(stone);

    // 승리 체크
    const isWin = this.winRule.checkWin(newBoard, selectedPosition, currentPlayer);

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
}

