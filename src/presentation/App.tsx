import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { GamePage } from './pages/GamePage';
import { LobbyPage } from './pages/LobbyPage';
import { RoomPage } from './pages/RoomPage';
import './styles/App.css';

type Page = 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room';

const getInitialPage = (): Page => {
  const savedPage = sessionStorage.getItem('currentPage') as Page | null;
  if (savedPage && ['home', 'login', 'signup', 'game', 'lobby', 'room'].includes(savedPage)) {
    return savedPage;
  }
  return 'home';
};

const getInitialRoomId = (): string | null => {
  return sessionStorage.getItem('currentRoomId');
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(getInitialRoomId);

  // 페이지 상태를 sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (currentRoomId) {
      sessionStorage.setItem('currentRoomId', currentRoomId);
    } else {
      sessionStorage.removeItem('currentRoomId');
    }
  }, [currentRoomId]);

  const handleNavigate = (page: Page) => {
    // 로비나 홈으로 이동 시 방 정보 초기화
    if (page === 'home' || page === 'lobby') {
      setCurrentRoomId(null);
    }
    setCurrentPage(page);
  };

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setCurrentPage('room');
  };

  switch (currentPage) {
    case 'login':
      return <LoginPage onNavigate={handleNavigate} />;
    case 'signup':
      return <SignupPage onNavigate={handleNavigate} />;
    case 'game':
      return <GamePage onNavigate={handleNavigate} />;
    case 'lobby':
      return <LobbyPage onNavigate={handleNavigate} onJoinRoom={handleJoinRoom} />;
    case 'room':
      return <RoomPage onNavigate={handleNavigate} />;
    case 'home':
    default:
      return <HomePage onNavigate={handleNavigate} />;
  }
}

export default App;
