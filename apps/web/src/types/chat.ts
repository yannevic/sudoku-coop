import type { Player } from '../utils/sudoku';

export type ChatMessageType = 'user' | 'system';

export interface ChatMessage {
  id: string;
  text: string;
  player: Player | 'system';
  playerName: string;
  type: ChatMessageType;
  timestamp: number;
}
