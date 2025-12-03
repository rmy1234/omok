import type { Room, RoomInfo, Player, MAX_SPECTATORS, GameMode } from '../types';
import { GameSession } from './game-session';

const MAX_SPECTATOR_COUNT = 5;

export class RoomManager {
  private rooms: Map<string, Room>;
  private gameSessions: Map<string, GameSession>;

  constructor() {
    this.rooms = new Map();
    this.gameSessions = new Map();
  }

  createRoom(name: string, host: Player, gameMode: GameMode = 'ranked'): Room {
    const id = this.generateRoomId();
    const room: Room = {
      id,
      name,
      host,
      guest: null,
      spectators: [],
      status: 'waiting',
      gameMode,
      createdAt: new Date(),
    };
    
    this.rooms.set(id, room);
    this.gameSessions.set(id, new GameSession());
    
    return room;
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getGameSession(roomId: string): GameSession | undefined {
    return this.gameSessions.get(roomId);
  }

  joinRoom(roomId: string, player: Player): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.guest !== null) return null;
    if (room.host.id === player.id) return null;

    room.guest = player;
    room.status = 'playing';

    // 게임 세션에 플레이어 설정
    const session = this.gameSessions.get(roomId);
    if (session) {
      session.setPlayers(room.host, player);
    }

    return room;
  }

  rejoinRoom(roomId: string, player: Player): { room: Room | null; isHost: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, isHost: false };

    // 닉네임으로 방장인지 확인
    if (room.host.nickname === player.nickname) {
      room.host.id = player.id;
      
      // 게임 세션에서도 플레이어 ID 업데이트
      const session = this.gameSessions.get(roomId);
      if (session) {
        session.updatePlayerId(room.host.nickname, player.id);
      }
      
      return { room, isHost: true };
    }

    // 닉네임으로 게스트인지 확인
    if (room.guest?.nickname === player.nickname) {
      room.guest.id = player.id;
      
      // 게임 세션에서도 플레이어 ID 업데이트
      const session = this.gameSessions.get(roomId);
      if (session) {
        session.updatePlayerId(room.guest.nickname, player.id);
      }
      
      return { room, isHost: false };
    }

    return { room: null, isHost: false };
  }

  leaveRoom(roomId: string, playerId: string): { deleted: boolean; room: Room | null } {
    const room = this.rooms.get(roomId);
    if (!room) return { deleted: false, room: null };

    // 방장이 나가면 방 삭제
    if (room.host.id === playerId) {
      this.rooms.delete(roomId);
      this.gameSessions.delete(roomId);
      return { deleted: true, room: null };
    }

    // 게스트가 나가면 방 상태 업데이트
    if (room.guest?.id === playerId) {
      room.guest = null;
      room.status = 'waiting';
      
      // 게임 세션 리셋
      const session = this.gameSessions.get(roomId);
      if (session) {
        this.gameSessions.set(roomId, new GameSession());
      }
      
      return { deleted: false, room };
    }

    return { deleted: false, room };
  }

  deleteRoom(roomId: string): boolean {
    const deleted = this.rooms.delete(roomId);
    this.gameSessions.delete(roomId);
    return deleted;
  }

  // 관전자 입장
  spectateRoom(roomId: string, spectator: Player): { room: Room | null; error: string | null; isRejoin: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, error: '방을 찾을 수 없습니다.', isRejoin: false };
    if (room.status !== 'playing') return { room: null, error: '게임 중인 방만 관전할 수 있습니다.', isRejoin: false };
    if (room.host.nickname === spectator.nickname || room.guest?.nickname === spectator.nickname) {
      return { room: null, error: '플레이어는 관전할 수 없습니다.', isRejoin: false };
    }
    
    // 이미 관전 중인 경우 ID만 업데이트 (재접속)
    const existingSpectator = room.spectators.find(s => s.nickname === spectator.nickname);
    if (existingSpectator) {
      existingSpectator.id = spectator.id;
      return { room, error: null, isRejoin: true };
    }
    
    // 관전자 수 체크
    if (room.spectators.length >= MAX_SPECTATOR_COUNT) return { room: null, error: '관전자가 가득 찼습니다. (최대 5명)', isRejoin: false };

    room.spectators.push(spectator);
    return { room, error: null, isRejoin: false };
  }

  // 관전자 퇴장
  leaveSpectate(roomId: string, spectatorId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const index = room.spectators.findIndex(s => s.id === spectatorId);
    if (index !== -1) {
      room.spectators.splice(index, 1);
    }
    return room;
  }

  getRoomList(): RoomInfo[] {
    const rooms: RoomInfo[] = [];
    
    this.rooms.forEach((room) => {
      rooms.push({
        id: room.id,
        name: room.name,
        hostNickname: room.host.nickname,
        playerCount: room.guest ? 2 : 1,
        spectatorCount: room.spectators.length,
        status: room.status,
      });
    });

    return rooms.sort((a, b) => 
      a.status === 'waiting' ? -1 : b.status === 'waiting' ? 1 : 0
    );
  }

  getRoomInfo(roomId: string): RoomInfo | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      hostNickname: room.host.nickname,
      playerCount: room.guest ? 2 : 1,
      spectatorCount: room.spectators.length,
      status: room.status,
    };
  }
}

export const roomManager = new RoomManager();

