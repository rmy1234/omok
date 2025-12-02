import { io, Socket } from 'socket.io-client';

// 현재 접속 호스트 기반으로 소켓 URL 동적 설정
const getSocketUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:3001`;
};

const SOCKET_URL = getSocketUrl();

// 타입 정의
export interface Player {
  id: string;
  nickname: string;
  isGuest: boolean;
}

export interface Room {
  id: string;
  name: string;
  host: Player;
  guest: Player | null;
  spectators: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}

export interface GameState {
  board: (string | null)[][];
  currentTurn: 'black' | 'white';
  blackPlayer: Player | null;
  whitePlayer: Player | null;
  winner: 'black' | 'white' | null;
  moveHistory: { row: number; col: number; color: 'black' | 'white' }[];
}

export interface RoomInfo {
  id: string;
  name: string;
  hostNickname: string;
  playerCount: number;
  spectatorCount: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('서버에 연결되었습니다.');
    });

    this.socket.on('disconnect', () => {
      console.log('서버 연결이 해제되었습니다.');
    });

    this.socket.on('error', (message: string) => {
      console.error('서버 오류:', message);
      this.emit('error', message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 이벤트 리스너 등록
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  // 이벤트 리스너 제거
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // 커스텀 이벤트 발생
  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  // 로비 관련
  getRooms(): void {
    this.socket?.emit('getRooms');
  }

  createRoom(roomName: string, player: Omit<Player, 'id'>): void {
    this.socket?.emit('createRoom', roomName, player);
  }

  joinRoom(roomId: string, player: Omit<Player, 'id'>): void {
    this.socket?.emit('joinRoom', roomId, player);
  }

  rejoinRoom(roomId: string, player: Omit<Player, 'id'>): void {
    this.socket?.emit('rejoinRoom', roomId, player);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leaveRoom', roomId);
  }

  // 관전 관련
  spectateRoom(roomId: string, player: Omit<Player, 'id'>): void {
    this.socket?.emit('spectateRoom', roomId, player);
  }

  leaveSpectate(roomId: string): void {
    this.socket?.emit('leaveSpectate', roomId);
  }

  // 게임 관련
  placeStone(roomId: string, row: number, col: number): void {
    this.socket?.emit('placeStone', roomId, row, col);
  }

  resetGame(roomId: string): void {
    this.socket?.emit('resetGame', roomId);
  }

  // 채팅 관련
  sendMessage(roomId: string, message: string): void {
    this.socket?.emit('sendMessage', roomId, message);
  }
}

export const socketClient = new SocketClient();

