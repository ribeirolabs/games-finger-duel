import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#2d1b4e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
  input: {
    activePointers: 2,
  },
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

document.body.addEventListener('touchstart', (e) => {
  const target = e.target as Element;
  if (target === document.body || target.closest('#game-container')) {
    e.preventDefault();
  }
}, { passive: false });

document.body.addEventListener('touchmove', (e) => {
  const target = e.target as Element;
  if (target === document.body || target.closest('#game-container')) {
    e.preventDefault();
  }
}, { passive: false });
