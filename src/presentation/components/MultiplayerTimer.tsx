import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const TURN_TIME_LIMIT = 30; // 30초

interface MultiplayerTimerProps {
  currentTurn: 'black' | 'white' | null;
  turnStartTime: number | null; // 서버에서 받은 턴 시작 시간
  gameWinner: 'black' | 'white' | null;
  className?: string;
}

export const MultiplayerTimer = ({ 
  currentTurn, 
  turnStartTime,
  gameWinner,
  className 
}: MultiplayerTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(TURN_TIME_LIMIT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 기존 인터벌 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 게임이 종료되었거나 턴이 없으면 타이머 정지
    if (gameWinner || !currentTurn) {
      return;
    }

    // 서버 시간 기반으로 남은 시간 계산
    const calculateTimeRemaining = () => {
      if (!turnStartTime) {
        return TURN_TIME_LIMIT;
      }
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      return Math.max(0, TURN_TIME_LIMIT - elapsed);
    };

    // 초기 시간 설정
    setTimeRemaining(calculateTimeRemaining());

    // 1초마다 업데이트
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentTurn, turnStartTime, gameWinner]);

  if (!currentTurn || gameWinner) {
    return null;
  }

  const percentage = (timeRemaining / TURN_TIME_LIMIT) * 100;
  const isWarning = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;

  return (
    <div className={`timer-container ${className || ''}`}>
      <div className="timer-label">남은 시간</div>
      <div className="timer-display">
        <motion.div
          className={`timer-circle ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
          animate={{ scale: isCritical ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          <svg className="timer-svg" viewBox="0 0 100 100">
            <circle
              className="timer-background"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <motion.circle
              className={`timer-progress ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
              initial={false}
              animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - percentage / 100)}` }}
              transition={{ duration: 0.3 }}
            />
          </svg>
          <div className="timer-text">
            <span className={`timer-seconds ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}>
              {timeRemaining}
            </span>
            <span className="timer-unit">초</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

