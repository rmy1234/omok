import { motion } from 'framer-motion';
import { Board } from '../components/Board';
import { useGameStore } from '../../infrastructure/state/game-store';
import { useUserStore } from '../../infrastructure/state/user-store';
import { StoneColor } from '../../domain/value-objects/stone-color';
import '../styles/App.css';
import '../styles/Auth.css';

interface GamePageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room') => void;
}

export function GamePage({ onNavigate }: GamePageProps) {
  const { gameState, resetGame } = useGameStore();
  const { currentUser, isGuest } = useUserStore();

  const handleExit = () => {
    resetGame();
    onNavigate('lobby');
  };

  const handleRestart = () => {
    resetGame();
  };

  const getCurrentPlayer = () => {
    return gameState.currentPlayer === 'BLACK' ? '흑' : '백';
  };

  return (
    <div className="app">
      <div className="app-container">
        <h1 className="app-title">오목</h1>
        
        <div className="game-info-card">
          {currentUser && (
            <div className="player-info-display">
              <span className="player-nickname">{currentUser.nickname}</span>
              {isGuest && <span className="guest-badge">게스트</span>}
            </div>
          )}
          
          <div className="current-player" style={{ 
            color: gameState.currentPlayer === 'BLACK' ? '#1a202c' : '#4a5568' 
          }}>
            현재 차례: {getCurrentPlayer()}
          </div>
          
          <div className="move-count">
            총 {gameState.board.getGrid().reduce((count, row) => 
              count + row.filter(cell => cell !== StoneColor.EMPTY).length, 0
            )}수
          </div>
          
          <div className="game-controls">
            <motion.button
              className="control-button reset"
              onClick={handleRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              새 게임
            </motion.button>
            <motion.button
              className="control-button home"
              onClick={handleExit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              로비로 돌아가기
            </motion.button>
          </div>
        </div>
        
        <Board onRestart={handleRestart} onExit={handleExit} />
      </div>
    </div>
  );
}
