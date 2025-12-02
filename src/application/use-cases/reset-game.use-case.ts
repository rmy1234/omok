import { Board } from '../../domain/entities/board';
import { GameState, GameStatus } from '../../domain/entities/game-state';
import { StoneColor } from '../../domain/value-objects/stone-color';

export class ResetGameUseCase {
  execute(): GameState {
    const board = new Board();
    return new GameState(
      board,
      StoneColor.BLACK,
      GameStatus.IN_PROGRESS,
      0
    );
  }
}




