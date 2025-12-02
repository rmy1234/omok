import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ServerToClientEvents, ClientToServerEvents, Player } from './types';
import { roomManager } from './game/room-manager';
import { initDatabase } from './db/sqlite';
import authRoutes from './routes/auth.routes';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// 인증 API 라우트
app.use('/api/auth', authRoutes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getRoomList().length });
});

// 재접속 대기 중인 플레이어 추적 (닉네임 -> 타이머)
const disconnectedPlayers: Map<string, NodeJS.Timeout> = new Map();
const RECONNECT_TIMEOUT = 30000; // 30초 대기

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log(`클라이언트 연결: ${socket.id}`);

  // 현재 참가 중인 방 ID 추적
  let currentRoomId: string | null = null;
  let currentPlayer: Player | null = null;

  // 방 목록 요청
  socket.on('getRooms', () => {
    socket.emit('roomList', roomManager.getRoomList());
  });

  // 방 생성
  socket.on('createRoom', (roomName: string, player: Player) => {
    const room = roomManager.createRoom(roomName, { ...player, id: socket.id });
    currentRoomId = room.id;
    currentPlayer = { ...player, id: socket.id };

    // 방에 입장
    socket.join(room.id);

    // 생성자에게 입장 정보 전송
    const session = roomManager.getGameSession(room.id);
    socket.emit('joinedRoom', room, session!.getState());

    // 모든 클라이언트에게 방 목록 업데이트
    io.emit('roomList', roomManager.getRoomList());

    console.log(`방 생성: ${room.name} (${room.id}) by ${player.nickname}`);
  });

  // 방 입장
  socket.on('joinRoom', (roomId: string, player: Player) => {
    const room = roomManager.joinRoom(roomId, { ...player, id: socket.id });
    
    if (!room) {
      socket.emit('error', '방에 입장할 수 없습니다.');
      return;
    }

    currentRoomId = room.id;
    currentPlayer = { ...player, id: socket.id };

    // 방에 입장
    socket.join(room.id);

    // 게임 세션 가져오기
    const session = roomManager.getGameSession(room.id);
    const gameState = session!.getState();

    // 입장자에게 정보 전송
    socket.emit('joinedRoom', room, gameState);

    // 방의 다른 플레이어에게 알림
    socket.to(room.id).emit('playerJoined', { ...player, id: socket.id });

    // 게임 시작 알림
    io.to(room.id).emit('gameStarted', gameState);

    // 모든 클라이언트에게 방 목록 업데이트
    io.emit('roomList', roomManager.getRoomList());

    console.log(`방 입장: ${room.name} (${room.id}) - ${player.nickname}`);
  });

  // 방 재접속 (새로고침 시)
  socket.on('rejoinRoom', (roomId: string, player: Player) => {
    // 대기 중인 타이머가 있으면 취소
    const timerKey = `${roomId}:${player.nickname}`;
    const existingTimer = disconnectedPlayers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      disconnectedPlayers.delete(timerKey);
      console.log(`재접속 타이머 취소: ${player.nickname}`);
    }

    const result = roomManager.rejoinRoom(roomId, { ...player, id: socket.id });
    
    if (!result.room) {
      // 방이 없으면 로비로 이동하도록 에러 전송
      socket.emit('error', '방을 찾을 수 없습니다. 로비로 이동합니다.');
      return;
    }

    currentRoomId = result.room.id;
    currentPlayer = { ...player, id: socket.id };

    // 방에 다시 입장
    socket.join(result.room.id);

    // 게임 세션 가져오기
    const session = roomManager.getGameSession(result.room.id);
    const gameState = session!.getState();

    // 재접속자에게 정보 전송
    socket.emit('joinedRoom', result.room, gameState);

    console.log(`방 재접속: ${result.room.name} (${result.room.id}) - ${player.nickname}`);
  });

  // 방 나가기
  socket.on('leaveRoom', (roomId: string) => {
    // 대기 중인 타이머가 있으면 취소
    if (currentPlayer) {
      const timerKey = `${roomId}:${currentPlayer.nickname}`;
      const existingTimer = disconnectedPlayers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        disconnectedPlayers.delete(timerKey);
      }
    }
    handleLeaveRoom(roomId);
  });

  // 관전 모드 추적
  let isSpectating = false;

  // 관전하기
  socket.on('spectateRoom', (roomId: string, player: Player) => {
    const result = roomManager.spectateRoom(roomId, { ...player, id: socket.id });
    
    if (result.error || !result.room) {
      socket.emit('error', result.error || '관전할 수 없습니다.');
      return;
    }

    currentRoomId = result.room.id;
    currentPlayer = { ...player, id: socket.id };
    isSpectating = true;

    // 방에 입장
    socket.join(result.room.id);

    // 게임 세션 가져오기
    const session = roomManager.getGameSession(result.room.id);
    const gameState = session!.getState();

    // 관전자에게 정보 전송
    socket.emit('joinedAsSpectator', result.room, gameState);

    // 재접속이 아닌 경우에만 다른 플레이어에게 알림
    if (!result.isRejoin) {
      // 방의 다른 플레이어에게 알림
      socket.to(result.room.id).emit('spectatorJoined', { ...player, id: socket.id });
    }

    // 모든 클라이언트에게 방 목록 업데이트
    io.emit('roomList', roomManager.getRoomList());

    console.log(`관전 입장: ${result.room.name} (${result.room.id}) - ${player.nickname}${result.isRejoin ? ' (재접속)' : ''}`);
  });

  // 관전 나가기
  socket.on('leaveSpectate', (roomId: string) => {
    const room = roomManager.leaveSpectate(roomId, socket.id);
    
    socket.leave(roomId);
    isSpectating = false;

    if (room) {
      socket.to(roomId).emit('spectatorLeft', socket.id);
    }

    io.emit('roomList', roomManager.getRoomList());
    
    currentRoomId = null;
    currentPlayer = null;

    console.log(`관전 나가기: ${socket.id}`);
  });

  // 돌 놓기
  socket.on('placeStone', (roomId: string, row: number, col: number) => {
    const session = roomManager.getGameSession(roomId);
    if (!session) {
      socket.emit('error', '게임을 찾을 수 없습니다.');
      return;
    }

    const success = session.placeStone(row, col, socket.id);
    if (!success) {
      socket.emit('error', '돌을 놓을 수 없습니다.');
      return;
    }

    const state = session.getState();
    const lastMove = state.moveHistory[state.moveHistory.length - 1];

    // 모든 플레이어에게 돌 놓기 알림
    io.to(roomId).emit('stonePlaced', lastMove.row, lastMove.col, lastMove.color);

    // 승리 체크
    const winner = session.getWinner();
    if (winner) {
      const winnerPlayer = winner === 'black' ? state.blackPlayer : state.whitePlayer;
      io.to(roomId).emit('gameEnded', winner, `${winnerPlayer?.nickname}님이 승리했습니다!`);
      
      // 방 상태 업데이트
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.status = 'finished';
        io.emit('roomList', roomManager.getRoomList());
      }
    } else {
      // 턴 변경 알림
      io.to(roomId).emit('turnChanged', state.currentTurn);
    }
  });

  // 게임 리셋
  socket.on('resetGame', (roomId: string) => {
    const session = roomManager.getGameSession(roomId);
    const room = roomManager.getRoom(roomId);
    
    if (!session || !room) {
      socket.emit('error', '게임을 찾을 수 없습니다.');
      return;
    }

    session.reset();
    room.status = 'playing';

    io.to(roomId).emit('gameReset', session.getState());
    io.emit('roomList', roomManager.getRoomList());

    console.log(`게임 리셋: ${room.name} (${room.id})`);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`클라이언트 연결 해제: ${socket.id}`);
    
    // 관전자인 경우 바로 나가기
    if (isSpectating && currentRoomId) {
      const room = roomManager.leaveSpectate(currentRoomId, socket.id);
      if (room) {
        io.to(currentRoomId).emit('spectatorLeft', socket.id);
      }
      io.emit('roomList', roomManager.getRoomList());
      return;
    }
    
    if (currentRoomId && currentPlayer) {
      const timerKey = `${currentRoomId}:${currentPlayer.nickname}`;
      
      // 이미 대기 중인 타이머가 있으면 무시
      if (disconnectedPlayers.has(timerKey)) {
        return;
      }

      console.log(`재접속 대기 시작: ${currentPlayer.nickname} (${RECONNECT_TIMEOUT / 1000}초)`);
      
      // 일정 시간 후 재접속이 없으면 방에서 나가기
      const roomIdCopy = currentRoomId;
      const timer = setTimeout(() => {
        disconnectedPlayers.delete(timerKey);
        console.log(`재접속 타임아웃: ${currentPlayer?.nickname}`);
        
        // 방에서 나가기 처리
        const result = roomManager.leaveRoom(roomIdCopy, socket.id);
        
        if (result.deleted) {
          io.to(roomIdCopy).emit('error', '방장이 나가서 방이 삭제되었습니다.');
          io.emit('roomDeleted', roomIdCopy);
        } else if (result.room) {
          io.to(roomIdCopy).emit('playerLeft', socket.id);
          const roomInfo = roomManager.getRoomInfo(roomIdCopy);
          if (roomInfo) {
            io.emit('roomUpdated', roomInfo);
          }
        }
        
        io.emit('roomList', roomManager.getRoomList());
      }, RECONNECT_TIMEOUT);
      
      disconnectedPlayers.set(timerKey, timer);
    }
  });

  // 방 나가기 처리 함수
  function handleLeaveRoom(roomId: string) {
    const result = roomManager.leaveRoom(roomId, socket.id);
    
    socket.leave(roomId);

    if (result.deleted) {
      // 방이 삭제됨
      io.to(roomId).emit('error', '방장이 나가서 방이 삭제되었습니다.');
      io.emit('roomDeleted', roomId);
    } else if (result.room) {
      // 게스트가 나감
      io.to(roomId).emit('playerLeft', socket.id);
      const roomInfo = roomManager.getRoomInfo(roomId);
      if (roomInfo) {
        io.emit('roomUpdated', roomInfo);
      }
    }

    io.emit('roomList', roomManager.getRoomList());
    
    currentRoomId = null;
    currentPlayer = null;

    console.log(`방 나가기: ${socket.id}`);
  }
});

const PORT = process.env.PORT || 3001;

// SQLite 초기화 후 서버 시작
function startServer() {
  try {
    // SQLite 데이터베이스 초기화
    initDatabase();

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🎮 게임 서버 실행 중: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();
