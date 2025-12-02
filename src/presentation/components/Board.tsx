import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Position } from '../../domain/value-objects/position';
import { useGameStore } from '../../infrastructure/state/game-store';
import { StoneColor } from '../../domain/value-objects/stone-color';
import { GameStatus } from '../../domain/entities/game-state';

const BOARD_SIZE = 15; // 15x15 교차점
const CELL_SIZE = 40; // 격자 한 칸 크기 (교차점 간 거리)
const BOARD_PADDING = 30; // 보드 가장자리 패딩
const GRID_SIZE = (BOARD_SIZE - 1) * CELL_SIZE; // 격자 전체 크기: 14 * 40 = 560px
const BOARD_TOTAL_SIZE = GRID_SIZE + BOARD_PADDING * 2; // 보드 전체 크기: 560 + 60 = 620px

// 화점 위치
const STAR_POINTS = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
];

interface BoardProps {
  onRestart?: () => void;
  onExit?: () => void;
}

export const Board = ({ onRestart, onExit }: BoardProps) => {
  const { gameState, placeStone } = useGameStore();
  const board = gameState.board;
  const boardRef = useRef<HTMLDivElement>(null);
  const [hoveredPos, setHoveredPos] = useState<{ row: number; col: number } | null>(null);

  // 마우스 위치에서 가장 가까운 교차점 계산
  const getIntersectionFromMouse = (e: React.MouseEvent<HTMLDivElement>): { row: number; col: number } | null => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - BOARD_PADDING;
    const y = e.clientY - rect.top - BOARD_PADDING;

    // 가장 가까운 교차점으로 반올림
    const col = Math.round(x / CELL_SIZE);
    const row = Math.round(y / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  };

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredPos(getIntersectionFromMouse(e));
  };

  const handleBoardMouseLeave = () => {
    setHoveredPos(null);
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.isGameOver()) return;
    const pos = getIntersectionFromMouse(e);
    if (pos) {
      placeStone(new Position(pos.row, pos.col));
    }
  };

  return (
    <div className="board-container">
      <motion.div
        ref={boardRef}
        className="board"
        onClick={handleBoardClick}
        onMouseMove={handleBoardMouseMove}
        onMouseLeave={handleBoardMouseLeave}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ 
          width: BOARD_TOTAL_SIZE, 
          height: BOARD_TOTAL_SIZE,
          cursor: gameState.isGameOver() ? 'default' : 'pointer' 
        }}
      >
        {/* SVG 격자선 */}
        <svg
          className="board-grid"
          width={BOARD_TOTAL_SIZE}
          height={BOARD_TOTAL_SIZE}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* 가로선 15개 */}
          {Array.from({ length: BOARD_SIZE }, (_, i) => {
            const y = BOARD_PADDING + i * CELL_SIZE;
            return (
              <line
                key={`h-${i}`}
                x1={BOARD_PADDING}
                y1={y}
                x2={BOARD_PADDING + GRID_SIZE}
                y2={y}
                stroke="#3c2814"
                strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? 2 : 1}
              />
            );
          })}
          {/* 세로선 15개 */}
          {Array.from({ length: BOARD_SIZE }, (_, i) => {
            const x = BOARD_PADDING + i * CELL_SIZE;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={BOARD_PADDING}
                x2={x}
                y2={BOARD_PADDING + GRID_SIZE}
                stroke="#3c2814"
                strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? 2 : 1}
              />
            );
          })}
          {/* 화점 9개 */}
          {STAR_POINTS.map(([row, col]) => {
            const cx = BOARD_PADDING + col * CELL_SIZE;
            const cy = BOARD_PADDING + row * CELL_SIZE;
            const pos = new Position(row, col);
            if (board.getStone(pos) !== StoneColor.EMPTY) return null;
            return (
              <circle
                key={`star-${row}-${col}`}
                cx={cx}
                cy={cy}
                r={4}
                fill="#3c2814"
              />
            );
          })}
        </svg>

        {/* 돌과 호버 프리뷰 */}
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const pos = new Position(row, col);
            const stoneColor = board.getStone(pos);
            const isHovered = hoveredPos?.row === row && hoveredPos?.col === col;
            const left = BOARD_PADDING + col * CELL_SIZE;
            const top = BOARD_PADDING + row * CELL_SIZE;

            return (
              <div key={`${row}-${col}`}>
                {stoneColor !== StoneColor.EMPTY && (
                  <motion.div
                    className={`stone stone-${stoneColor.toLowerCase()}`}
                    style={{ left, top }}
                    initial={{ scale: 0, x: '-50%', y: '-50%' }}
                    animate={{ scale: 1, x: '-50%', y: '-50%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                )}
                {stoneColor === StoneColor.EMPTY && !gameState.isGameOver() && isHovered && (
                  <div className="stone-preview" style={{ left, top }} />
                )}
              </div>
            );
          })
        )}
      </motion.div>

      {/* 바둑판 위 승리 모달 */}
      <AnimatePresence>
        {gameState.isGameOver() && (
          <motion.div
            className="board-victory-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="board-victory-modal"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className={`victory-stone ${gameState.status === GameStatus.BLACK_WIN ? 'black' : 'white'}`} />
              <h2 className="victory-title">
                {gameState.status === GameStatus.BLACK_WIN ? '흑 승리!' : 
                 gameState.status === GameStatus.WHITE_WIN ? '백 승리!' : '무승부!'}
              </h2>
              <p className="victory-move-count">
                총 {gameState.board.getGrid().reduce((count, row) => 
                  count + row.filter(cell => cell !== StoneColor.EMPTY).length, 0
                )}수
              </p>
              <div className="victory-buttons">
                {onRestart && (
                  <motion.button
                    className="victory-button restart-button"
                    onClick={onRestart}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    다시 하기
                  </motion.button>
                )}
                {onExit && (
                  <motion.button
                    className="victory-button exit-button"
                    onClick={onExit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    나가기
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
