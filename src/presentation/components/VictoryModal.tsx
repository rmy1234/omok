import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus } from '../../domain/entities/game-state';

interface VictoryModalProps {
  gameStatus: GameStatus;
  moveCount: number;
  onRestart: () => void;
  onExit: () => void;
}

export const VictoryModal = ({
  gameStatus,
  moveCount,
  onRestart,
  onExit,
}: VictoryModalProps) => {
  const getWinnerMessage = (): string => {
    switch (gameStatus) {
      case GameStatus.BLACK_WIN:
        return '흑 승리!';
      case GameStatus.WHITE_WIN:
        return '백 승리!';
      case GameStatus.DRAW:
        return '무승부!';
      default:
        return '';
    }
  };

  const isVisible =
    gameStatus === GameStatus.BLACK_WIN ||
    gameStatus === GameStatus.WHITE_WIN ||
    gameStatus === GameStatus.DRAW;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 팝업 모달 */}
          <motion.div
            className="victory-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="victory-modal-content">
              <h2 className="victory-title">{getWinnerMessage()}</h2>
              <p className="victory-move-count">총 {moveCount}수</p>

              <div className="victory-buttons">
                <motion.button
                  className="victory-button restart-button"
                  onClick={onRestart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  다시 시작
                </motion.button>
                <motion.button
                  className="victory-button exit-button"
                  onClick={onExit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  나가기
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

