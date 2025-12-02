import { useState } from 'react';
import { motion } from 'framer-motion';
import { signupUseCase } from '../../application/use-cases/auth/signup.use-case';
import { useUserStore } from '../../infrastructure/state/user-store';
import '../styles/Auth.css';

interface SignupPageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room') => void;
}

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signupUseCase.execute({ username, nickname, password });
      
      if (result.success && result.user) {
        setUser(result.user);
        onNavigate('home');
      } else {
        setError(result.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="auth-title">회원가입</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 사용할 닉네임 (2자 이상)"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="로그인에 사용할 아이디 (4자 이상)"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </motion.button>
        </form>

        <div className="auth-links">
          <span>이미 계정이 있으신가요?</span>
          <button
            className="link-button"
            onClick={() => onNavigate('login')}
          >
            로그인
          </button>
        </div>

        <motion.button
          className="back-button"
          onClick={() => onNavigate('home')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          홈으로 돌아가기
        </motion.button>
      </motion.div>
    </div>
  );
}

