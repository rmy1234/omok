// 공유 타입 정의

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

export const MAX_SPECTATORS = 5;

export interface GameState {
  board: (string | null)[][];
  currentTurn: 'black' | 'white';
  blackPlayer: Player | null;
  whitePlayer: Player | null;
  winner: 'black' | 'white' | null;
  moveHistory: { row: number; col: number; color: 'black' | 'white' }[];
  turnStartTime: number | null; // 서버 타이머 동기화용
}

export interface RoomInfo {
  id: string;
  name: string;
  hostNickname: string;
  playerCount: number;
  spectatorCount: number;
  status: 'waiting' | 'playing' | 'finished';
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
  isSpectator?: boolean;
}

// Socket.io 이벤트 타입
export interface ServerToClientEvents {
  // 로비 이벤트
  roomList: (rooms: RoomInfo[]) => void;
  roomCreated: (room: RoomInfo) => void;
  roomUpdated: (room: RoomInfo) => void;
  roomDeleted: (roomId: string) => void;
  
  // 방 이벤트
  joinedRoom: (room: Room, gameState: GameState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (gameState: GameState) => void;
  
  // 관전 이벤트
  joinedAsSpectator: (room: Room, gameState: GameState) => void;
  spectatorJoined: (spectator: Player) => void;
  spectatorLeft: (spectatorId: string) => void;
  
  // 게임 이벤트
  stonePlaced: (row: number, col: number, color: 'black' | 'white') => void;
  turnChanged: (turn: 'black' | 'white', turnStartTime: number) => void;
  gameEnded: (winner: 'black' | 'white', reason: string) => void;
  gameReset: (gameState: GameState) => void;
  
  // 채팅 이벤트
  newMessage: (message: ChatMessage) => void;
  chatHistory: (messages: ChatMessage[]) => void;
  
  // 에러
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  // 로비 이벤트
  getRooms: () => void;
  createRoom: (roomName: string, player: Player) => void;
  joinRoom: (roomId: string, player: Player) => void;
  rejoinRoom: (roomId: string, player: Player) => void;
  leaveRoom: (roomId: string) => void;
  
  // 관전 이벤트
  spectateRoom: (roomId: string, player: Player) => void;
  leaveSpectate: (roomId: string) => void;
  
  // 게임 이벤트
  placeStone: (roomId: string, row: number, col: number) => void;
  resetGame: (roomId: string) => void;
  
  // 채팅 이벤트
  sendMessage: (roomId: string, message: string) => void;
}

