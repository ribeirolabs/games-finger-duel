import { HandState, PlayerState, GameMove, GamePhase } from '../types';

export class GameState {
  private player1: PlayerState;
  private player2: PlayerState;
  private currentPlayerIndex: 1 | 2;
  private phase: GamePhase;

  constructor() {
    this.player1 = this.createPlayer(1);
    this.player2 = this.createPlayer(2);
    this.currentPlayerIndex = 1;
    this.phase = 'playing';
  }

  private createPlayer(id: number): PlayerState {
    return {
      leftHand: { fingers: 1, isAlive: true, position: 'left' },
      rightHand: { fingers: 1, isAlive: true, position: 'right' },
      isCurrentPlayer: id === 1,
    };
  }

  getCurrentPlayer(): PlayerState {
    return this.currentPlayerIndex === 1 ? this.player1 : this.player2;
  }

  getOpponentPlayer(): PlayerState {
    return this.currentPlayerIndex === 1 ? this.player2 : this.player1;
  }

  getPlayer1(): PlayerState {
    return this.player1;
  }

  getPlayer2(): PlayerState {
    return this.player2;
  }

  getCurrentPlayerIndex(): 1 | 2 {
    return this.currentPlayerIndex;
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  setPhase(phase: GamePhase): void {
    this.phase = phase;
  }

  getAliveHands(player: PlayerState): HandState[] {
    return [player.leftHand, player.rightHand].filter((hand) => hand.isAlive);
  }

  getDeadHands(player: PlayerState): HandState[] {
    return [player.leftHand, player.rightHand].filter((hand) => !hand.isAlive);
  }

  canAttack(hand: 'left' | 'right'): boolean {
    const player = this.getCurrentPlayer();
    const handState = hand === 'left' ? player.leftHand : player.rightHand;
    return handState.isAlive && handState.fingers > 0;
  }

  canSplit(hand: 'left' | 'right'): boolean {
    const player = this.getCurrentPlayer();
    const handState = hand === 'left' ? player.leftHand : player.rightHand;
    const deadHands = this.getDeadHands(player);
    return (
      handState.isAlive &&
      handState.fingers > 0 &&
      handState.fingers % 2 === 0 &&
      deadHands.length > 0
    );
  }

  getSplitTarget(hand: 'left' | 'right'): 'left' | 'right' | null {
    const player = this.getCurrentPlayer();
    const deadHands = this.getDeadHands(player);
    if (deadHands.length === 0) return null;

    if (hand === 'left' && !player.leftHand.isAlive) return 'left';
    if (hand === 'right' && !player.rightHand.isAlive) return 'right';
    if (hand === 'left' && !player.rightHand.isAlive) return 'right';
    if (hand === 'right' && !player.leftHand.isAlive) return 'left';

    return null;
  }

  isValidAttack(sourceHand: 'left' | 'right', targetHand: 'left' | 'right'): boolean {
    const player = this.getCurrentPlayer();
    const opponent = this.getOpponentPlayer();
    const source = sourceHand === 'left' ? player.leftHand : player.rightHand;
    const target = targetHand === 'left' ? opponent.leftHand : opponent.rightHand;

    return source.isAlive && target.isAlive && source.fingers > 0;
  }

  executeMove(move: GameMove): { success: boolean; message?: string } {
    if (this.phase !== 'playing') {
      return { success: false, message: 'Game is not in playing phase' };
    }

    const player = this.getCurrentPlayer();
    const opponent = this.getOpponentPlayer();

    if (move.type === 'attack') {
      if (!move.targetHand) {
        return { success: false, message: 'No target hand specified' };
      }
      if (!this.isValidAttack(move.sourceHand, move.targetHand)) {
        return { success: false, message: 'Invalid attack move' };
      }

      const source = move.sourceHand === 'left' ? player.leftHand : player.rightHand;
      const target = move.targetHand === 'left' ? opponent.leftHand : opponent.rightHand;

      const total = source.fingers + target.fingers;
      target.fingers = total % 5;

      if (total === 5) {
        target.isAlive = false;
      }

      this.endTurn();
      return { success: true };
    } else if (move.type === 'split') {
      if (!this.canSplit(move.sourceHand)) {
        return { success: false, message: 'Cannot split this hand' };
      }

      const targetHand = this.getSplitTarget(move.sourceHand);
      if (!targetHand) {
        return { success: false, message: 'No dead hand to reactivate' };
      }

      const source = move.sourceHand === 'left' ? player.leftHand : player.rightHand;
      const fingersPerHand = source.fingers / 2;

      source.fingers = fingersPerHand;
      const target = targetHand === 'left' ? player.leftHand : player.rightHand;
      target.fingers = fingersPerHand;
      target.isAlive = true;

      this.endTurn();
      return { success: true };
    }

    return { success: false, message: 'Unknown move type' };
  }

  private endTurn(): void {
    if (this.checkGameOver()) {
      return;
    }

    this.currentPlayerIndex = this.currentPlayerIndex === 1 ? 2 : 1;

    const currentPlayer = this.getCurrentPlayer();
    if (!this.hasValidMoves(currentPlayer)) {
      this.currentPlayerIndex = this.currentPlayerIndex === 1 ? 2 : 1;
    }
  }

  private hasValidMoves(_player: PlayerState): boolean {
    const hands: ('left' | 'right')[] = ['left', 'right'];
    for (const hand of hands) {
      if (this.canAttack(hand)) return true;
      if (this.canSplit(hand)) return true;
    }
    return false;
  }

  checkGameOver(): boolean {
    const p1Alive = this.getAliveHands(this.player1).length > 0;
    const p2Alive = this.getAliveHands(this.player2).length > 0;

    if (!p1Alive || !p2Alive) {
      this.phase = 'gameOver';
      return true;
    }

    if (!p1Alive && !p2Alive) {
      this.phase = 'gameOver';
      return true;
    }

    return false;
  }

  getWinner(): 1 | 2 | null {
    const p1Alive = this.getAliveHands(this.player1).length > 0;
    const p2Alive = this.getAliveHands(this.player2).length > 0;

    if (!p1Alive && !p2Alive) return null;
    if (p1Alive && !p2Alive) return 1;
    if (!p1Alive && p2Alive) return 2;
    return null;
  }

  reset(): void {
    this.player1 = this.createPlayer(1);
    this.player2 = this.createPlayer(2);
    this.currentPlayerIndex = 1;
    this.phase = 'playing';
  }

  serialize(): { player1: PlayerState; player2: PlayerState; currentPlayer: number; phase: GamePhase } {
    return {
      player1: this.player1,
      player2: this.player2,
      currentPlayer: this.currentPlayerIndex,
      phase: this.phase,
    };
  }
}
