export type GameMode = 'race' | 'timed';

export type RoomStatus = 'lobby' | 'playing' | 'round_over' | 'match_over';

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'none';

export interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  botDifficulty: BotDifficulty;
  score: number;
  clearedCount: number; // 0 to 64
  roundsWon: number;
  isHost: boolean;
  active: boolean;
  lastActive: number;
}

export interface RoomData {
  id: string;
  code: string;
  hostId: string;
  mode: GameMode;
  status: RoomStatus;
  round: number;
  maxRounds: number; // usually 3 for race
  winnerId?: string;
  winnerName?: string;
  startTime?: number;
  endTime?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CellData {
  id: number; // index 0-63
  value: number; // 1-9
  cleared: boolean;
  matchedInStep?: number;
  row: number; // 0-7
  col: number; // 0-7
}

export interface MatchedPairRecord {
  id: string;
  num1: number;
  num2: number;
  timestamp: number;
}
