export interface HandState {
  fingers: number;
  isAlive: boolean;
  position: 'left' | 'right';
}

export interface PlayerState {
  leftHand: HandState;
  rightHand: HandState;
  isCurrentPlayer: boolean;
}

export interface GameMove {
  type: 'attack' | 'split';
  sourceHand: 'left' | 'right';
  targetHand?: 'left' | 'right';
  fingersTransferred?: number;
}

export interface ParticleConfig {
  x: number;
  y: number;
  color: number;
  count: number;
  lifespan?: number;
  speed?: number;
  scale?: number;
}

export type GamePhase = 'playing' | 'gameOver' | 'animating';

export const FINGER_COLORS = {
  0: 0x444444,
  1: 0xff6b9d,
  2: 0xffd93d,
  3: 0x6bcb77,
  4: 0x4d96ff,
} as const;

export const PLAYER_COLORS = {
  player1: 0xff6b6b,
  player2: 0x4ecdc4,
} as const;
