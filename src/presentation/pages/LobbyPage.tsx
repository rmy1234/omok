import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketClient, type RoomInfo } from '../../infrastructure/socket/socket-client';
import { useUserStore } from '../../infrastructure/state/user-store';
import { getStats } from '../../infrastructure/api/auth-api';
import '../styles/Lobby.css';

interface LobbyPageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room') => void;
  onJoinRoom: (roomId: string) => void;
}

export function LobbyPage({ onNavigate, onJoinRoom }: LobbyPageProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser, isGuest, stats, setStats } = useUserStore();

  // 전적 정보 새로고침
  useEffect(() => {
    if (currentUser && !isGuest) {
      getStats(currentUser.nickname).then((result) => {
        if (result.success && result.stats) {
          setStats(result.stats);
        }
      });
    }
  }, [currentUser, isGuest, setStats]);

  useEffect(() => {
    // 소켓 연결
    const socket = socketClient.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      socketClient.getRooms();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 방 목록 수신
    socket.on('roomList', (roomList: RoomInfo[]) => {
      setRooms(roomList);
    });

    // 방 입장 성공
    socket.on('joinedRoom', () => {
      onNavigate('room');
    });

    // 관전 입장 성공
    socket.on('joinedAsSpectator', () => {
      onNavigate('room');
    });

    // 에러 처리
    socket.on('error', (message: string) => {
      alert(message);
    });

    // 초기 방 목록 요청
    if (socket.connected) {
      socketClient.getRooms();
      setIsConnected(true);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomList');
      socket.off('joinedRoom');
      socket.off('joinedAsSpectator');
      socket.off('error');
    };
  }, [onNavigate]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert('방 이름을 입력해주세요.');
      return;
    }

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 관전 상태 초기화
    sessionStorage.removeItem('isSpectating');

    socketClient.createRoom(roomName.trim(), {
      nickname: currentUser.nickname,
      isGuest: 'isGuest' in currentUser && currentUser.isGuest,
    });

    setShowCreateModal(false);
    setRoomName('');
    onNavigate('room');
  };

  const handleJoinRoom = (roomId: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 관전 상태 초기화
    sessionStorage.removeItem('isSpectating');

    socketClient.joinRoom(roomId, {
      nickname: currentUser.nickname,
      isGuest: 'isGuest' in currentUser && currentUser.isGuest,
    });

    onJoinRoom(roomId);
  };

  const handleSoloPlay = () => {
    onNavigate('game');
  };

  const handleSpectate = (roomId: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 관전 상태 미리 저장
    sessionStorage.setItem('isSpectating', 'true');
    sessionStorage.setItem('currentRoomId', roomId);

    socketClient.spectateRoom(roomId, {
      nickname: currentUser.nickname,
      isGuest: 'isGuest' in currentUser && currentUser.isGuest,
    });
  };

  return (
    <div className="lobby-container">
      <motion.div
        className="lobby-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="lobby-header">
          <h1 className="lobby-title">게임 로비</h1>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 연결됨' : '🔴 연결 중...'}
          </div>
        </div>

        {/* 사용자 정보 및 전적 */}
        {currentUser && (
          <div className="user-stats-card">
            <div className="user-info-row">
              <span className="user-nickname">{currentUser.nickname}</span>
              {isGuest && <span className="guest-tag">게스트</span>}
            </div>
            {!isGuest && stats && (
              <div className="stats-row">
                <div className="stat-item win">
                  <span className="stat-label">승</span>
                  <span className="stat-value">{stats.wins}</span>
                </div>
                <div className="stat-item draw">
                  <span className="stat-label">무</span>
                  <span className="stat-value">{stats.draws}</span>
                </div>
                <div className="stat-item loss">
                  <span className="stat-label">패</span>
                  <span className="stat-value">{stats.losses}</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item winrate">
                  <span className="stat-label">승률</span>
                  <span className="stat-value">{stats.winRate}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="lobby-actions">
          <motion.button
            className="lobby-button primary"
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ➕ 방 만들기
          </motion.button>
          <motion.button
            className="lobby-button solo"
            onClick={handleSoloPlay}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            혼자 하기
          </motion.button>
        </div>

        <div className="room-list-container">
          <h2 className="room-list-title">방 목록 ({rooms.length})</h2>
          
          {rooms.length === 0 ? (
            <div className="no-rooms">
              <p>생성된 방이 없습니다.</p>
              <p>새로운 방을 만들어보세요!</p>
            </div>
          ) : (
            <div className="room-list">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  className={`room-item ${room.status}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="room-info">
                    <span className="room-name">{room.name}</span>
                    <span className="room-host">방장: {room.hostNickname}</span>
                  </div>
                  <div className="room-meta">
                    <span className={`room-status ${room.status}`}>
                      {room.status === 'waiting' && '대기 중'}
                      {room.status === 'playing' && '게임 중'}
                      {room.status === 'finished' && '종료'}
                    </span>
                    <span className="room-players">{room.playerCount}/2</span>
                    {room.status === 'playing' && (
                      <span className="room-spectators">👁 {room.spectatorCount}/5</span>
                    )}
                  </div>
                  <div className="room-buttons">
                    {room.status === 'playing' && room.spectatorCount < 5 && (
                      <motion.button
                        className="spectate-button"
                        onClick={() => handleSpectate(room.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        관전
                      </motion.button>
                    )}
                    {room.status === 'waiting' && (
                      <motion.button
                        className="join-button"
                        onClick={() => handleJoinRoom(room.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        입장
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

      {/* 방 생성 모달 */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="create-room-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>새 방 만들기</h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="방 이름을 입력하세요"
                maxLength={20}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <div className="modal-buttons">
                <motion.button
                  className="modal-button cancel"
                  onClick={() => setShowCreateModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  취소
                </motion.button>
                <motion.button
                  className="modal-button confirm"
                  onClick={handleCreateRoom}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  만들기
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

