import { motion } from 'framer-motion';
import { StoneColor } from '../../domain/value-objects/stone-color';

interface StoneCellProps {
  row: number;
  col: number;
  stoneColor: StoneColor;
  isGameOver: boolean;
  isHovered: boolean;
}

// 화점 위치 (15x15 기준)
const STAR_POINTS = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
];

export const StoneCell = ({
  row,
  col,
  stoneColor,
  isGameOver,
  isHovered,
}: StoneCellProps) => {
  const isStarPoint = STAR_POINTS.some(([r, c]) => r === row && c === col);

  return (
    <div className="cell">
      {/* 화점 */}
      {isStarPoint && stoneColor === StoneColor.EMPTY && <div className="star-point" />}

      {/* 돌 */}
      {stoneColor !== StoneColor.EMPTY && (
        <motion.div
          className={`stone stone-${stoneColor.toLowerCase()}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        />
      )}

      {/* 호버 효과 (빈 칸일 때만) */}
      {stoneColor === StoneColor.EMPTY && !isGameOver && isHovered && (
        <div className="stone-preview" />
      )}
    </div>
  );
};
