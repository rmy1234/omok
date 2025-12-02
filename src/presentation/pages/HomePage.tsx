import { motion } from 'framer-motion';
import { useUserStore } from '../../infrastructure/state/user-store';
import { guestLoginUseCase } from '../../application/use-cases/auth/guest-login.use-case';
import '../styles/Auth.css';

interface HomePageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { isAuthenticated, currentUser, setGuestUser, logout } = useUserStore();

  const handlePlayGame = () => {
    if (isAuthenticated) {
      // 로그인 상태면 로비로 이동
      onNavigate('lobby');
    } else {
      // 로그인이 필요한 경우 로그인 페이지로 이동
      onNavigate('login');
    }
  };

  const handleGuestStart = () => {
    const result = guestLoginUseCase.execute();
    if (result.success) {
      setGuestUser(result.user);
      // 게스트도 로비로 이동
      onNavigate('lobby');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card home-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="auth-title">오목</h1>
        <p className="auth-subtitle">전략적인 오목 게임에 오신 것을 환영합니다</p>

        {isAuthenticated && currentUser && (
          <motion.div
            className="user-info-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="user-nickname">{currentUser.nickname}</span>
            {'isGuest' in currentUser && currentUser.isGuest && (
              <span className="guest-badge">게스트</span>
            )}
          </motion.div>
        )}

        <div className="home-buttons">
          <motion.button
            className="home-button primary"
            onClick={handlePlayGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            게임 하기
          </motion.button>

          {!isAuthenticated ? (
            <>
              <motion.button
                className="home-button secondary"
                onClick={() => onNavigate('login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                로그인
              </motion.button>

              <motion.button
                className="home-button secondary"
                onClick={() => onNavigate('signup')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                회원가입
              </motion.button>

              <motion.button
                className="home-button guest"
                onClick={handleGuestStart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                게스트로 시작하기
              </motion.button>
            </>
          ) : (
            <motion.button
              className="home-button logout"
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              로그아웃
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
