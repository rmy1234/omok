import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketClient, type Room, type GameState, type Player } from '../../infrastructure/socket/socket-client';
import { useUserStore } from '../../infrastructure/state/user-store';
import { ChatBox } from '../components/ChatBox';
import { MultiplayerTimer } from '../components/MultiplayerTimer';
import '../styles/App.css';
import '../styles/Lobby.css';
import '../styles/Chat.css';

interface RoomPageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room') => void;
}

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

export function RoomPage({ onNavigate }: RoomPageProps) {
  // sessionStorage에서 관전 상태 확인
  const savedIsSpectating = sessionStorage.getItem('isSpectating') === 'true';
  
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isWaiting, setIsWaiting] = useState(!savedIsSpectating);
  const [isSpectating, setIsSpectating] = useState(savedIsSpectating);
  const [isLoading, setIsLoading] = useState(true);
  const [winner, setWinner] = useState<{ color: 'black' | 'white'; message: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUserStore();

  const myColor = useCallback((): 'black' | 'white' | null => {
    if (!gameState || !currentUser) return null;
    if (gameState.blackPlayer?.nickname === currentUser.nickname) return 'black';
    if (gameState.whitePlayer?.nickname === currentUser.nickname) return 'white';
    return null;
  }, [gameState, currentUser]);

  const isMyTurn = useCallback((): boolean => {
    const color = myColor();
    if (!color || !gameState) return false;
    return gameState.currentTurn === color;
  }, [myColor, gameState]);

  useEffect(() => {
    let socket = socketClient.getSocket();
    
    // 소켓이 없으면 재연결 시도
    if (!socket) {
      socket = socketClient.connect();
    }

    // 타이머 참조
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let hasJoined = false;

    // 방 입장 정보 수신
    const handleJoinedRoom = (roomData: Room, state: GameState) => {
      hasJoined = true;
      setRoom(roomData);
      setGameState(state);
      setIsWaiting(roomData.status === 'waiting');
      setIsLoading(false);
      sessionStorage.setItem('currentRoomId', roomData.id);
    };

    // 관전자로 입장
    const handleJoinedAsSpectator = (roomData: Room, state: GameState) => {
      hasJoined = true;
      setRoom(roomData);
      setGameState(state);
      setIsWaiting(false);
      setIsSpectating(true);
      setIsLoading(false);
      sessionStorage.setItem('currentRoomId', roomData.id);
      sessionStorage.setItem('isSpectating', 'true');
    };

    // 플레이어 입장
    const handlePlayerJoined = (player: Player) => {
      setRoom((prev) => prev ? { ...prev, guest: player, status: 'playing' } : null);
      setIsWaiting(false);
    };

    // 플레이어 퇴장
    const handlePlayerLeft = () => {
      setIsWaiting(true);
      setGameState(null);
      setWinner(null);
    };

    // 게임 시작
    const handleGameStarted = (state: GameState) => {
      setGameState(state);
      setIsWaiting(false);
      setWinner(null);
    };

    // 돌 놓기
    const handleStonePlaced = (row: number, col: number, color: 'black' | 'white') => {
      setGameState((prev) => {
        if (!prev) return null;
        const newBoard = prev.board.map((r) => [...r]);
        if (newBoard[row] && newBoard[row][col] === null) {
          newBoard[row][col] = color;
        }
        return {
          ...prev,
          board: newBoard,
          moveHistory: [...prev.moveHistory, { row, col, color }],
          // 턴 변경과 타이머는 turnChanged 이벤트에서 처리
        };
      });
    };

    // 턴 변경
    const handleTurnChanged = (turn: 'black' | 'white', turnStartTime: number) => {
      setGameState((prev) => prev ? { ...prev, currentTurn: turn, turnStartTime } : null);
    };

    // 게임 종료
    const handleGameEnded = (winnerColor: 'black' | 'white', message: string) => {
      setWinner({ color: winnerColor, message });
      setGameState((prev) => prev ? { ...prev, winner: winnerColor } : null);
    };

    // 게임 리셋
    const handleGameReset = (state: GameState) => {
      setGameState(state);
      setWinner(null);
    };

    // 에러
    const handleError = (message: string) => {
      if (message.includes('방장') || message.includes('삭제') || message.includes('찾을 수 없습니다')) {
        sessionStorage.removeItem('currentRoomId');
        alert(message);
        onNavigate('lobby');
      }
    };

    // 관전자 입장
    const handleSpectatorJoined = (spectator: Player) => {
      setRoom((prev) => prev ? { ...prev, spectators: [...prev.spectators, spectator] } : null);
    };

    // 관전자 퇴장
    const handleSpectatorLeft = (spectatorId: string) => {
      setRoom((prev) => prev ? { 
        ...prev, 
        spectators: prev.spectators.filter(s => s.id !== spectatorId) 
      } : null);
    };

    // 모든 이벤트 리스너 등록
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('joinedAsSpectator', handleJoinedAsSpectator);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarted', handleGameStarted);
    socket.on('stonePlaced', handleStonePlaced);
    socket.on('turnChanged', handleTurnChanged);
    socket.on('gameEnded', handleGameEnded);
    socket.on('gameReset', handleGameReset);
    socket.on('error', handleError);
    socket.on('spectatorJoined', handleSpectatorJoined);
    socket.on('spectatorLeft', handleSpectatorLeft);

    // 새로고침 시 저장된 방 ID로 재접속
    const savedRoomId = sessionStorage.getItem('currentRoomId');
    const savedIsSpectating = sessionStorage.getItem('isSpectating') === 'true';
    
    if (savedRoomId && currentUser) {
      reconnectTimer = setTimeout(() => {
        if (!hasJoined && socket.connected) {
          if (savedIsSpectating) {
            socketClient.spectateRoom(savedRoomId, {
              nickname: currentUser.nickname,
              isGuest: 'isGuest' in currentUser && currentUser.isGuest,
            });
          } else {
            socketClient.rejoinRoom(savedRoomId, {
              nickname: currentUser.nickname,
              isGuest: 'isGuest' in currentUser && currentUser.isGuest,
            });
          }
        }
      }, 100);
    }

    // cleanup
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('joinedAsSpectator', handleJoinedAsSpectator);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('gameStarted', handleGameStarted);
      socket.off('stonePlaced', handleStonePlaced);
      socket.off('turnChanged', handleTurnChanged);
      socket.off('gameEnded', handleGameEnded);
      socket.off('gameReset', handleGameReset);
      socket.off('error', handleError);
      socket.off('spectatorJoined', handleSpectatorJoined);
      socket.off('spectatorLeft', handleSpectatorLeft);
    };
  }, [onNavigate, currentUser]);

  // 마우스 위치에서 가장 가까운 교차점 계산
  const getIntersectionFromMouse = (e: React.MouseEvent<HTMLDivElement>): { row: number; col: number } | null => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - BOARD_PADDING;
    const y = e.clientY - rect.top - BOARD_PADDING;

    // 마우스 좌표를 격자 간격으로 나누어 가장 가까운 교차점 인덱스 계산
    const col = Math.round(x / CELL_SIZE);
    const row = Math.round(y / CELL_SIZE);

    // 유효한 범위인지 확인 (0부터 BOARD_SIZE-1까지)
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  };

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getIntersectionFromMouse(e);
    setHoveredCell(pos);
  };

  const handleBoardMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 관전자는 돌을 놓을 수 없음
    if (isSpectating) return;
    if (!room || !gameState || !isMyTurn() || gameState.winner) return;

    const pos = getIntersectionFromMouse(e);
    if (!pos) return;

    const { row, col } = pos;
    if (gameState.board[row][col] !== null) return;

    socketClient.placeStone(room.id, row, col);
  };

  const handleLeaveRoom = () => {
    if (room) {
      if (isSpectating) {
        socketClient.leaveSpectate(room.id);
        sessionStorage.removeItem('isSpectating');
      } else {
        socketClient.leaveRoom(room.id);
      }
    }
    sessionStorage.removeItem('currentRoomId');
    onNavigate('lobby');
  };

  const handleRestart = () => {
    if (room) {
      socketClient.resetGame(room.id);
    }
  };

  // 로딩 중 (관전자일 때)
  if (isLoading && isSpectating) {
    return (
      <div className="lobby-container">
        <motion.div
          className="lobby-card waiting-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="lobby-title">접속 중...</h1>
          <p className="waiting-message">게임에 연결하고 있습니다.</p>
          <div className="waiting-animation">
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            />
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // 대기 화면 (관전자가 아닐 때만)
  if (isWaiting && !isSpectating) {
    return (
      <div className="lobby-container">
        <motion.div
          className="lobby-card waiting-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="lobby-title">대기 중...</h1>
          <p className="waiting-message">상대방을 기다리고 있습니다.</p>
          {room && (
            <div className="room-code-box">
              <span>방 이름:</span>
              <strong>{room.name}</strong>
            </div>
          )}
          <div className="waiting-animation">
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            />
            <motion.div
              className="waiting-dot"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            />
          </div>
          <motion.button
            className="back-button"
            onClick={handleLeaveRoom}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            로비로 돌아가기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <div className="game-header">
          <div className="game-header-left">
            <h1 className="app-title">오목</h1>
            {room && (
              <div className="room-name-tag">
                <span className="room-label">방</span>
                <span className="room-name-text">{room.name}</span>
              </div>
            )}
            {isSpectating && (
              <div className="spectator-badge">관전 중</div>
            )}
          </div>
          <motion.button
            className="header-exit-button"
            onClick={handleLeaveRoom}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            나가기
          </motion.button>
        </div>

        {/* 플레이어 정보 */}
        <div className="players-info">
          <div className={`player-box black ${gameState?.currentTurn === 'black' ? 'active' : ''}`}>
            <span className="stone-icon black-stone" />
            <span className="player-name">{gameState?.blackPlayer?.nickname || '---'}</span>
            {myColor() === 'black' && <span className="my-badge">나</span>}
          </div>
          <span className="vs-text">VS</span>
          <div className={`player-box white ${gameState?.currentTurn === 'white' ? 'active' : ''}`}>
            <span className="stone-icon white-stone" />
            <span className="player-name">{gameState?.whitePlayer?.nickname || '---'}</span>
            {myColor() === 'white' && <span className="my-badge">나</span>}
          </div>
        </div>

        {/* 턴 표시 및 타이머 */}
        <div className="turn-info-container">
          <div className="turn-info">
            {isSpectating ? (
              <span className="spectator-turn">
                {gameState?.currentTurn === 'black' ? '흑' : '백'}의 차례입니다
              </span>
            ) : isMyTurn() ? (
              <span className="my-turn">내 차례입니다!</span>
            ) : (
              <span className="opponent-turn">상대방 차례입니다...</span>
            )}
          </div>
          {gameState && !gameState.winner && (
            <MultiplayerTimer
              currentTurn={gameState.currentTurn}
              turnStartTime={gameState.turnStartTime}
              gameWinner={gameState.winner}
            />
          )}
        </div>

        {/* 관전자 목록 */}
        {room && room.spectators.length > 0 && (
          <div className="spectators-info">
            <span className="spectators-label">👁 관전자 ({room.spectators.length}/5):</span>
            <span className="spectators-list">
              {room.spectators.map(s => s.nickname).join(', ')}
            </span>
          </div>
        )}

        {/* 게임 레이아웃 (보드 + 채팅) */}
        <div className="game-layout">
          {/* 게임 보드 */}
          <div className="game-main">
            <div className="board-container">
              <div
                ref={boardRef}
                className="board"
                onClick={handleBoardClick}
                onMouseMove={handleBoardMouseMove}
                onMouseLeave={handleBoardMouseLeave}
                style={{ 
                  width: BOARD_TOTAL_SIZE, 
                  height: BOARD_TOTAL_SIZE,
                  cursor: !isSpectating && isMyTurn() && !winner ? 'pointer' : 'default' 
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
                    const stone = gameState?.board[row]?.[col];
                    if (stone) return null;
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

                {/* 모든 교차점에 돌/프리뷰 렌더링 */}
                {Array.from({ length: BOARD_SIZE }, (_, row) =>
                  Array.from({ length: BOARD_SIZE }, (_, col) => {
                    const stone = gameState?.board[row]?.[col];
                    const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                    const left = BOARD_PADDING + col * CELL_SIZE;
                    const top = BOARD_PADDING + row * CELL_SIZE;
                    
                    // 마지막 수 확인
                    const lastMove = gameState?.moveHistory && gameState.moveHistory.length > 0
                      ? gameState.moveHistory[gameState.moveHistory.length - 1]
                      : null;
                    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;

                    return (
                      <div key={`${row}-${col}`}>
                        {stone && (
                          <motion.div
                            className={`stone stone-${stone} ${isLastMove ? 'last-move' : ''}`}
                            style={{ left, top }}
                            initial={{ scale: 0, x: '-50%', y: '-50%' }}
                            animate={{ scale: 1, x: '-50%', y: '-50%' }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                        {!stone && isHovered && !isSpectating && isMyTurn() && !winner && (
                          <div className="stone-preview" style={{ left, top }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 바둑판 위 승리 모달 */}
              <AnimatePresence>
                {winner && (
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
                      <div className={`victory-stone ${winner.color}`} />
                      <h2 className="victory-title">
                        {isSpectating 
                          ? `${winner.color === 'black' ? '흑' : '백'} 승리!`
                          : winner.color === myColor() ? '승리!' : '패배...'}
                      </h2>
                      <p className="victory-message">{winner.message}</p>
                      <p className="victory-move-count">
                        총 {gameState?.board.reduce((count, row) => 
                          count + row.filter(cell => cell !== null).length, 0
                        ) ?? 0}수
                      </p>
                      <div className="victory-buttons">
                        {!isSpectating && (
                          <motion.button
                            className="victory-button restart-button"
                            onClick={handleRestart}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            다시 하기
                          </motion.button>
                        )}
                        <motion.button
                          className="victory-button exit-button"
                          onClick={handleLeaveRoom}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          나가기
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 채팅 박스 - 관전자는 채팅 사용 불가 */}
          {room && currentUser && !isSpectating && (
            <ChatBox 
              roomId={room.id} 
              currentUserNickname={currentUser.nickname} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

