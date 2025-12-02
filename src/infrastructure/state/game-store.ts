import { create } from 'zustand';
import { GameState, GameStatus } from '../../domain/entities/game-state';
import { Board } from '../../domain/entities/board';
import { ForbiddenRule } from '../../domain/rules/forbidden-rule';
import { WinRule } from '../../domain/rules/win-rule';
import { PlaceStoneUseCase } from '../../application/use-cases/place-stone.use-case';
import { ResetGameUseCase } from '../../application/use-cases/reset-game.use-case';
import { Position } from '../../domain/value-objects/position';
import { StoneColor } from '../../domain/value-objects/stone-color';

interface GameStore {
  gameState: GameState;
  placeStone: (position: Position) => void;
  resetGame: () => void;
  error: string | null;
  clearError: () => void;
}

const winRule = new WinRule();
const forbiddenRule = new ForbiddenRule();
const placeStoneUseCase = new PlaceStoneUseCase(winRule, forbiddenRule);
const resetGameUseCase = new ResetGameUseCase();

// 게임 상태 저장
const saveGameState = (gameState: GameState) => {
  try {
    const data = {
      board: gameState.board.toJSON(),
      currentPlayer: gameState.currentPlayer,
      status: gameState.status,
      moveHistory: gameState.moveHistory,
    };
    sessionStorage.setItem('soloGameState', JSON.stringify(data));
  } catch (e) {
    console.error('게임 상태 저장 실패:', e);
  }
};

// 게임 상태 복원
const loadGameState = (): GameState | null => {
  try {
    const saved = sessionStorage.getItem('soloGameState');
    if (!saved) return null;

    const data = JSON.parse(saved);
    const board = Board.fromJSON(data.board);
    return new GameState(
      board,
      data.currentPlayer as StoneColor,
      data.status as GameStatus,
      data.moveHistory
    );
  } catch (e) {
    console.error('게임 상태 복원 실패:', e);
    return null;
  }
};

// 저장된 상태가 있으면 복원, 없으면 새 게임
const getInitialGameState = (): GameState => {
  const savedState = loadGameState();
  return savedState || resetGameUseCase.execute();
};

export const useGameStore = create<GameStore>((set) => ({
  gameState: getInitialGameState(),
  error: null,

  placeStone: (position: Position) => {
    set((state) => {
      const result = placeStoneUseCase.execute(state.gameState, position);

      if (!result.success) {
        return {
          ...state,
          error: result.error || '알 수 없는 오류가 발생했습니다.',
        };
      }

      // 상태 저장
      saveGameState(result.newGameState!);

      return {
        ...state,
        gameState: result.newGameState!,
        error: null,
      };
    });
  },

  resetGame: () => {
    const newGameState = resetGameUseCase.execute();
    // 저장된 상태 삭제
    sessionStorage.removeItem('soloGameState');
    set({
      gameState: newGameState,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

