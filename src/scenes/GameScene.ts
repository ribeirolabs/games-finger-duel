import * as Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { GameMove, PLAYER_COLORS } from '../types';
import { soundManager } from '../effects/SoundManager';
import { ParticleManager } from '../effects/ParticleManager';

type HandPosition = { x: number; y: number; hand: 'left' | 'right' };

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private particleManager!: ParticleManager;
  private handSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private fingerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private dragLine!: Phaser.GameObjects.Graphics;
  private dragHand: Phaser.GameObjects.Container | null = null;
  private isDragging: boolean = false;
  private currentDragHand: 'left' | 'right' | null = null;
  private dragTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private turnIndicator!: Phaser.GameObjects.Container;
  private turnIndicatorArrow!: Phaser.GameObjects.Text;
  private backgroundTint!: Phaser.GameObjects.Graphics;
  private screenShakeIntensity: number = 0;
  private lastTapTime: number = 0;
  private lastTapHand: string = '';
  private readonly DOUBLE_TAP_THRESHOLD = 300;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameState = new GameState();
    this.particleManager = new ParticleManager(this);

    this.createBackground();
    this.createTurnIndicator();
    this.createHandSprites();
    this.createDragLine();

    this.setupInput();
    this.updateTurnIndicator();
    this.setupHtmlModals();
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.setDepth(0);
    bg.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a0f2e, 0x1a0f2e, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    this.backgroundTint = this.add.graphics();
    this.backgroundTint.setDepth(1);

    const divider = this.add.graphics();
    divider.setDepth(2);
    divider.lineStyle(2, 0xffffff, 0.1);
    divider.lineBetween(0, this.scale.height * 0.5, this.scale.width, this.scale.height * 0.5);
  }

  private createTurnIndicator(): void {
    this.turnIndicator = this.add.container(this.scale.width / 2, 40);
    this.turnIndicatorArrow = this.add.text(0, 0, '▲', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.turnIndicator.add(this.turnIndicatorArrow);

    this.tweens.add({
      targets: this.turnIndicatorArrow,
      y: 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private calculateHandPositions(): Record<string, HandPosition> {
    const w = this.scale.width;
    const h = this.scale.height;

    return {
      'p1-left': { x: w * 0.25, y: h * 0.25, hand: 'left' },
      'p1-right': { x: w * 0.75, y: h * 0.25, hand: 'right' },
      'p2-left': { x: w * 0.75, y: h * 0.75, hand: 'right' },
      'p2-right': { x: w * 0.25, y: h * 0.75, hand: 'left' },
    };
  }

  private createHandSprites(): void {
    this.handSprites.clear();
    this.fingerTexts.clear();

    const positions = this.calculateHandPositions();

    Object.entries(positions).forEach(([key, pos]) => {
      const container = this.createHandSprite(key, pos.x, pos.y);
      this.handSprites.set(key, container);
    });
  }

  private createHandSprite(key: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const [player, hand] = key.split('-') as ['p1' | 'p2', 'left' | 'right'];
    const playerColor = player === 'p1' ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;

    const playerState = player === 'p1' ? this.gameState.getPlayer1() : this.gameState.getPlayer2();
    const handState = hand === 'left' ? playerState.leftHand : playerState.rightHand;
    const initialFingers = handState.fingers.toString();

    const baseRadius = 70;
    const glowRadius = 85;

    const glow = this.add.graphics();
    glow.fillStyle(playerColor, 0.3);
    glow.fillCircle(0, 0, glowRadius);
    container.add(glow);
    container.setData('glow', glow);

    const base = this.add.graphics();
    base.fillStyle(playerColor, 1);
    base.fillCircle(0, 0, baseRadius);
    base.fillStyle(0xffffff, 0.2);
    base.fillCircle(-baseRadius * 0.2, -baseRadius * 0.2, baseRadius * 0.35);
    container.add(base);

    const fingersText = this.add.text(0, 0, initialFingers, {
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(fingersText);
    this.fingerTexts.set(key, fingersText);

    const hitRadius = 120;

    const hitArea = this.add.graphics();
    hitArea.fillStyle(player === 'p1' ? 0xff6b6b : 0x4ecdc4, 0);
    hitArea.fillCircle(0, 0, hitRadius);
    container.add(hitArea);
    container.setData('hitArea', hitArea);

    container.setInteractive(new Phaser.Geom.Circle(0, 0, hitRadius), Phaser.Geom.Circle.Contains);
    container.setDepth(10);

    return container;
  }

  private createDragLine(): void {
    this.dragLine = this.add.graphics();
    this.dragLine.setDepth(100);
  }

  private async initializeSound(): Promise<void> {
    await soundManager.initialize();
  }

  private setupHtmlModals(): void {
    const instructionsModal = document.getElementById('instructions-modal');
    const instructionsClose = document.getElementById('instructions-close');
    const gameOverModal = document.getElementById('gameover-modal');
    const restartBtn = document.getElementById('restart-btn');

    const hasSeenInstructions = localStorage.getItem('finger-duel-instructions');
    if (!hasSeenInstructions && instructionsModal) {
      instructionsModal.classList.add('active');
    }

    instructionsClose?.addEventListener('click', () => {
      localStorage.setItem('finger-duel-instructions', 'true');
      instructionsModal?.classList.remove('active');
    });

    restartBtn?.addEventListener('click', () => {
      this.initializeSound();
      gameOverModal?.classList.remove('active');
      this.restartGame();
    });
  }

  private setupInput(): void {
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.input.on('gameout', () => {
      if (this.isDragging) {
        this.cancelDrag();
      }
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.initializeSound();

    if (this.gameState.getPhase() !== 'playing') return;

    const currentPlayerIndex = this.gameState.getCurrentPlayerIndex();
    const playerPrefix = currentPlayerIndex === 1 ? 'p1' : 'p2';

    const handKey = this.getHandKeyAtPointer(pointer, playerPrefix);
    if (!handKey) return;

    const [, hand] = handKey.split('-') as ['p1' | 'p2', 'left' | 'right'];

    if (this.gameState.canSplit(hand)) {
      const now = this.time.now;
      const isSameHand = this.lastTapHand === handKey;
      const isQuickTap = now - this.lastTapTime < this.DOUBLE_TAP_THRESHOLD;

      if (isSameHand && isQuickTap) {
        this.executeSplit(hand);
        this.lastTapTime = 0;
        this.lastTapHand = '';
        return;
      }

      this.lastTapTime = now;
      this.lastTapHand = handKey;
    }

    if (!this.gameState.canAttack(hand)) return;

    soundManager.playTouchSound();
    this.startDrag(handKey, pointer);
  }

  private getHandKeyAtPointer(pointer: Phaser.Input.Pointer, playerPrefix: string): string | null {
    for (const [key, container] of this.handSprites) {
      if (!key.startsWith(playerPrefix)) continue;

      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        container.x,
        container.y
      );

      if (distance <= 110) {
        return key;
      }
    }
    return null;
  }

  private startDrag(handKey: string, _pointer: Phaser.Input.Pointer): void {
    this.isDragging = true;
    const container = this.handSprites.get(handKey)!;
    const [, hand] = handKey.split('-') as [string, 'left' | 'right'];
    this.currentDragHand = hand;

    this.dragHand = container;
    this.dragHand.setScale(1.1);

    const playerPrefix = handKey.split('-')[0];
    const color = playerPrefix === 'p1' ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;

    this.dragTrail = this.particleManager.createTrail(
      container.x,
      container.y,
      color
    );

    this.highlightValidTargets(hand);
  }

  private highlightValidTargets(sourceHand: 'left' | 'right'): void {
    this.clearHighlights();

    if (!this.gameState.canAttack(sourceHand)) return;

    const opponentPrefix = this.gameState.getCurrentPlayerIndex() === 1 ? 'p2' : 'p1';
    const targetHands = ['left', 'right'] as const;

    for (const targetHand of targetHands) {
      const targetKey = `${opponentPrefix}-${targetHand}`;
      const container = this.handSprites.get(targetKey);
      if (container && this.gameState.isValidAttack(sourceHand, targetHand)) {
        this.addGlowEffect(container, 0x00ff00);
      }
    }
  }

  private addGlowEffect(container: Phaser.GameObjects.Container, color: number): void {
    const glow = container.getData('glow') as Phaser.GameObjects.Graphics;
    if (!glow) return;

    glow.clear();
    glow.fillStyle(color, 0.5);
    glow.fillCircle(0, 0, 80);

    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private clearHighlights(): void {
    this.handSprites.forEach((container) => {
      const glow = container.getData('glow') as Phaser.GameObjects.Graphics;

      if (glow) {
        const key = Array.from(this.handSprites.keys()).find(k => this.handSprites.get(k) === container);
        const playerPrefix = key?.split('-')[0];
        const color = playerPrefix === 'p1' ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;
        glow.clear();
        glow.fillStyle(color, 0.3);
        glow.fillCircle(0, 0, 70);
      }
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || !this.dragHand) return;

    if (this.dragTrail) {
      this.dragTrail.setPosition(pointer.x, pointer.y);
    }

    this.dragLine.clear();
    this.dragLine.lineStyle(4, 0xffffff, 0.6);
    this.dragLine.beginPath();
    this.dragLine.moveTo(this.dragHand.x, this.dragHand.y);
    this.dragLine.lineTo(pointer.x, pointer.y);
    this.dragLine.strokePath();

    const currentPlayerIndex = this.gameState.getCurrentPlayerIndex();
    const opponentPrefix = currentPlayerIndex === 1 ? 'p2' : 'p1';

    const overHand = this.getHandKeyAtPointer(pointer, opponentPrefix);

    this.handSprites.forEach((container, key) => {
      if (key.startsWith(opponentPrefix)) {
        if (key === overHand) {
          const [, hand] = key.split('-') as [string, 'left' | 'right'];
          if (this.currentDragHand !== null && this.gameState.isValidAttack(this.currentDragHand, hand)) {
            this.dragLine.clear();
            this.dragLine.lineStyle(6, 0x00ff00, 0.8);
            this.dragLine.beginPath();
            this.dragLine.moveTo(this.dragHand!.x, this.dragHand!.y);
            this.dragLine.lineTo(pointer.x, pointer.y);
            this.dragLine.strokePath();

            this.tweens.add({
              targets: container,
              scale: 1.15,
              duration: 100,
              ease: 'Sine.easeOut',
            });
          }
        } else {
          this.tweens.add({
            targets: container,
            scale: 1,
            duration: 100,
            ease: 'Sine.easeOut',
          });
        }
      }
    });
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || !this.currentDragHand) {
      this.cancelDrag();
      return;
    }

    const currentPlayerIndex = this.gameState.getCurrentPlayerIndex();
    const opponentPrefix = currentPlayerIndex === 1 ? 'p2' : 'p1';

    const overHand = this.getHandKeyAtPointer(pointer, opponentPrefix);

    if (overHand) {
      const [, targetHand] = overHand.split('-') as [string, 'left' | 'right'];

      if (this.gameState.isValidAttack(this.currentDragHand, targetHand)) {
        this.executeAttack(this.currentDragHand, targetHand);
      } else {
        soundManager.playErrorSound();
        this.cancelDrag();
      }
    } else {
      soundManager.playErrorSound();
      this.cancelDrag();
    }
  }

  private executeAttack(sourceHand: 'left' | 'right', targetHand: 'left' | 'right'): void {
    const sourceState = this.gameState.getCurrentPlayer();
    const sourceFingers = sourceHand === 'left' ? sourceState.leftHand.fingers : sourceState.rightHand.fingers;

    const move: GameMove = {
      type: 'attack',
      sourceHand,
      targetHand,
    };

    const result = this.gameState.executeMove(move);

    if (result.success) {
      soundManager.playAttackSound(sourceFingers);
      this.cameras.main.shake(100, 0.005 * sourceFingers);

      const targetKey = `p2-${targetHand}`;
      const targetContainer = this.handSprites.get(targetKey);
      if (targetContainer) {
        this.particleManager.createExplosion(
          targetContainer.x,
          targetContainer.y,
          sourceFingers,
          false
        );
      }

      this.updateHandDisplay();
      this.updateTurnIndicator();

      if (this.gameState.getPhase() === 'gameOver') {
        this.showGameOver();
      }
    }

    this.cancelDrag();
  }

  private executeSplit(sourceHand: 'left' | 'right'): void {
    const currentPlayerIndex = this.gameState.getCurrentPlayerIndex();

    const sourceState = this.gameState.getCurrentPlayer();
    const fingers = sourceHand === 'left' ? sourceState.leftHand.fingers : sourceState.rightHand.fingers;

    const move: GameMove = {
      type: 'split',
      sourceHand,
    };

    const result = this.gameState.executeMove(move);

    if (result.success) {
      soundManager.playSplitSound();

      const sourceKey = `${currentPlayerIndex === 1 ? 'p1' : 'p2'}-${sourceHand}`;
      const sourceContainer = this.handSprites.get(sourceKey);
      if (sourceContainer) {
        this.particleManager.createSplitEffect(sourceContainer.x, sourceContainer.y, fingers);
      }

      this.updateHandDisplay();
      this.updateTurnIndicator();
    }

    this.cancelDrag();
  }

  private cancelDrag(): void {
    this.isDragging = false;
    this.currentDragHand = null;

    if (this.dragHand) {
      this.tweens.add({
        targets: this.dragHand,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
      this.dragHand = null;
    }

    this.dragLine.clear();
    if (this.dragTrail) {
      this.dragTrail.destroy();
      this.dragTrail = null;
    }
    this.clearHighlights();
  }

  private updateHandDisplay(): void {
    this.handSprites.forEach((container) => {
      this.tweens.killTweensOf(container);
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Sine.easeOut',
      });
    });

    const p1 = this.gameState.getPlayer1();
    const p2 = this.gameState.getPlayer2();

    const states = [
      { key: 'p1-left', state: p1.leftHand },
      { key: 'p1-right', state: p1.rightHand },
      { key: 'p2-left', state: p2.leftHand },
      { key: 'p2-right', state: p2.rightHand },
    ];

    states.forEach(({ key, state }) => {
      const container = this.handSprites.get(key);
      if (!container) return;

      this.tweens.killTweensOf(container);

      const text = this.fingerTexts.get(key);
      const glow = container.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      const playerPrefix = key.split('-')[0] as 'p1' | 'p2';
      const playerColor = playerPrefix === 'p1' ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;

      if (state.isAlive) {
        text?.setText(state.fingers.toString());
        text?.setColor('#ffffff');

        this.tweens.add({
          targets: container,
          alpha: 1,
          scale: 1,
          duration: 200,
          ease: 'Sine.easeOut',
        });

        glow?.clear();
        glow?.fillStyle(playerColor, 0.3);
        glow?.fillCircle(0, 0, 70);
      } else {
        if (text) {
          text.setText('✕');
          text.setColor('#666666');
          text.setPosition(0, 0);
          text.setScale(1);
        }

        this.particleManager.createDeathEffect(container.x, container.y);
        soundManager.playDeathSound();

        this.cameras.main.shake(100, 0.01);

        this.tweens.add({
          targets: container,
          x: container.x + 5,
          duration: 50,
          yoyo: true,
          repeat: 5,
          ease: 'Sine.easeInOut',
        });

        this.tweens.add({
          targets: container,
          alpha: 0.3,
          scale: 0.8,
          duration: 300,
          ease: 'Sine.easeOut',
          delay: 300,
        });

        glow?.clear();
        glow?.fillStyle(0x333333, 0.3);
        glow?.fillCircle(0, 0, 55);
      }
    });
  }

  private updateTurnIndicator(): void {
    soundManager.playTurnChangeSound();

    const currentPlayerIndex = this.gameState.getCurrentPlayerIndex();
    const isPlayer1 = currentPlayerIndex === 1;
    const y = isPlayer1 ? 40 : this.scale.height - 40;

    this.tweens.killTweensOf(this.turnIndicator);
    this.tweens.add({
      targets: this.turnIndicator,
      y: y,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.turnIndicatorArrow.setText(isPlayer1 ? '▲' : '▼');

    this.drawTurnBackground(isPlayer1);

    const color = isPlayer1 ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;
    this.particleManager.createTurnIndicatorEffect(this.scale.width / 2, y, color);
  }

  private drawTurnBackground(isPlayer1: boolean): void {
    const color = isPlayer1 ? 0x3d1b2e : 0x1b2e3d;
    const y = isPlayer1 ? 0 : this.scale.height * 0.5;

    this.backgroundTint.clear();
    this.backgroundTint.fillStyle(color, 0.5);
    this.backgroundTint.fillRect(0, y, this.scale.width, this.scale.height * 0.5);
  }

  private showGameOver(): void {
    const winner = this.gameState.getWinner();

    soundManager.playVictorySound();
    this.cameras.main.shake(500, 0.02);

    (window as any).showGameOver?.(winner);

    this.particleManager.createVictoryEffect(this.scale.width / 2, this.scale.height / 2);
  }

  private restartGame(): void {
    this.gameState.reset();
    this.createHandSprites();
    this.updateTurnIndicator();
  }

  update(_time: number, delta: number): void {
    if (this.screenShakeIntensity > 0) {
      const intensity = this.screenShakeIntensity;
      this.cameras.main.shake(delta, intensity);
      this.screenShakeIntensity *= 0.95;
      if (this.screenShakeIntensity < 0.001) {
        this.screenShakeIntensity = 0;
      }
    }
  }
}
