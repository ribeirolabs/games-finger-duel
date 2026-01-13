import * as Phaser from 'phaser';
import { FINGER_COLORS } from '../types';

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private createTexture(key: string, color: number, size: number = 8): void {
    if (this.scene.textures.exists(key)) return;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createFingerTexture(color: number): string {
    const key = `finger_${color.toString(16)}`;
    this.createTexture(key, color, 12);
    return key;
  }

  private createSparkTexture(color: number): string {
    const key = `spark_${color.toString(16)}`;
    this.createTexture(key, color, 6);
    return key;
  }

  private createRingTexture(color: number): string {
    const key = `ring_${color.toString(16)}`;
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics.lineStyle(3, color, 1);
    graphics.strokeCircle(20, 20, 18);
    graphics.generateTexture(key, 40, 40);
    graphics.destroy();
    return key;
  }

  createExplosion(x: number, y: number, fingers: number, isDeath: boolean = false): void {
    const color = FINGER_COLORS[fingers as keyof typeof FINGER_COLORS] || 0xffffff;
    const particleKey = this.createFingerTexture(color);
    const sparkKey = this.createSparkTexture(0xffd700);

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: particleKey,
      lifespan: isDeath ? 800 : 500,
      speed: { min: 50, max: 200 },
      scale: { start: 0.8, end: 0 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      quantity: isDeath ? 20 : 8 + fingers * 2,
      emitting: false,
    };

    const sparkEmitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: sparkKey,
      lifespan: 300,
      speed: { min: 100, max: 300 },
      scale: { start: 0.5, end: 0 },
      quantity: 10,
      emitting: false,
    };

    const emitter = this.scene.add.particles(0, 0, particleKey, emitterConfig);
    const sparkEmitter = this.scene.add.particles(0, 0, sparkKey, sparkEmitterConfig);

    emitter.setPosition(x, y);
    sparkEmitter.setPosition(x, y);

    emitter.explode();
    sparkEmitter.explode();

    setTimeout(() => {
      emitter.destroy();
      sparkEmitter.destroy();
    }, 1000);
  }

  createSplitEffect(x: number, y: number, fingers: number): void {
    const color = FINGER_COLORS[fingers as keyof typeof FINGER_COLORS] || 0xffffff;
    const particleKey = this.createFingerTexture(color);
    const ringKey = this.createRingTexture(color);

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: particleKey,
      lifespan: 600,
      speed: { min: 30, max: 80 },
      scale: { start: 0.6, end: 0 },
      angle: { min: 0, max: 360 },
      quantity: 6,
      emitting: false,
    };

    const ringConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: ringKey,
      lifespan: 400,
      speed: 0,
      scale: { start: 0.5, end: 2 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
    };

    const emitter = this.scene.add.particles(0, 0, particleKey, emitterConfig);
    const ring = this.scene.add.particles(0, 0, ringKey, ringConfig);

    emitter.setPosition(x, y);
    ring.setPosition(x, y);

    emitter.explode();
    ring.explode();

    setTimeout(() => {
      emitter.destroy();
      ring.destroy();
    }, 700);
  }

  createDeathEffect(x: number, y: number): void {
    const color = 0xff4444;
    const particleKey = this.createFingerTexture(color);

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: particleKey,
      lifespan: 1000,
      speed: { min: 80, max: 250 },
      scale: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      rotate: { min: -180, max: 180 },
      gravityY: 200,
      quantity: 30,
      emitting: false,
    };

    const emitter = this.scene.add.particles(0, 0, particleKey, emitterConfig);
    emitter.setPosition(x, y);
    emitter.explode();

    setTimeout(() => {
      emitter.destroy();
    }, 1200);
  }

  createVictoryEffect(x: number, y: number): void {
    const colors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0x6bcb77, 0x4d96ff];

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleKey = this.createSparkTexture(color);

        const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
          x: x + (Math.random() - 0.5) * 300,
          y: y + (Math.random() - 0.5) * 200,
          texture: particleKey,
          lifespan: 1500,
          speed: { min: 100, max: 300 },
          scale: { start: 0.6, end: 0 },
          gravityY: -100,
          quantity: 1,
          emitting: false,
        };

        const emitter = this.scene.add.particles(0, 0, particleKey, emitterConfig);
        emitter.explode();
        setTimeout(() => emitter.destroy(), 1600);
      }, i * 30);
    }
  }

  createTurnIndicatorEffect(x: number, y: number, color: number): void {
    const ringKey = this.createRingTexture(color);

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: ringKey,
      lifespan: 500,
      speed: 0,
      scale: { start: 0.3, end: 1.5 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
    };

    const emitter = this.scene.add.particles(0, 0, ringKey, emitterConfig);
    emitter.setPosition(x, y);
    emitter.explode();
    setTimeout(() => emitter.destroy(), 600);
  }

  createTrail(x: number, y: number, color: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const particleKey = this.createSparkTexture(color);

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: x,
      y: y,
      texture: particleKey,
      lifespan: 200,
      speed: 0,
      scale: { start: 0.4, end: 0 },
      quantity: 1,
      maxParticles: 5,
      emitting: true,
    };

    return this.scene.add.particles(0, 0, particleKey, emitterConfig);
  }

  createTouchRipple(x: number, y: number, color: number): void {
    const ringKey = this.createRingTexture(color);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
          x: x,
          y: y,
          texture: ringKey,
          lifespan: 400,
          speed: 0,
          scale: { start: 0.2 + i * 0.1, end: 1 + i * 0.3 },
          alpha: { start: 0.8 - i * 0.2, end: 0 },
          quantity: 1,
          emitting: false,
        };

        const emitter = this.scene.add.particles(0, 0, ringKey, emitterConfig);
        emitter.setPosition(x, y);
        emitter.explode();
        setTimeout(() => emitter.destroy(), 500);
      }, i * 80);
    }
  }

  destroy(): void {
  }
}
