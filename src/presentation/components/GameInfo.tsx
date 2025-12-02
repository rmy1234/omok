import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus } from '../../domain/entities/game-state';
import { StoneColor } from '../../domain/value-objects/stone-color';
import { useGameStore } from '../../infrastructure/state/game-store';

export const GameInfo = () => {
  const { gameState, resetGame, error, clearError } = useGameStore();

  const getStatusMessage = (): string => {
    // 게임이 종료되었으면 상태 메시지를 표시하지 않음 (팝업으로 표시)
    if (gameState.isGameOver()) {
      return '';
    }

    switch (gameState.status) {
      case GameStatus.WAITING:
        return '게임 시작을 기다리는 중...';
      case GameStatus.IN_PROGRESS:
        return `현재 차례: ${
          gameState.currentPlayer === StoneColor.BLACK ? '흑' : '백'
        }`;
      default:
        return '';
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="game-info">
      {statusMessage && (
        <motion.div
          className="status-message"
          key={gameState.status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {statusMessage}
        </motion.div>
      )}

      {!gameState.isGameOver() && (
        <div className="move-count">
          총 {gameState.moveHistory}수
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onClick={clearError}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="reset-button"
        onClick={resetGame}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        새 게임
      </motion.button>
    </div>
  );
};




