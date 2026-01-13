# Finger Duel

A local multiplayer finger game built with Phaser 3 and TypeScript.

## How to Play

**Local Multiplayer!** Two players on the same device.

### Controls
- **Drag** your hand to opponent's hand to attack
- **Double-tap** your hand to split and reactivate a disabled hand

### Rules
- **Attack**: Your fingers + Opponent's fingers
  - Examples: 2 + 2 = 4 | 3 + 3 = 6 → 1 (6-5) | 4 + 4 = 8 → 3 (8-5)
- Hand reaches **exactly 5** = disabled
- **Win** by disabling both opponent hands

### Players
- **Player 1 (RED)** - Top half of screen
- **Player 2 (BLUE)** - Bottom half of screen

## Development

### Tech Stack
- Phaser 3 - Game engine
- TypeScript - Type-safe JavaScript
- Vite - Build tool
- Bun - Package manager
- Tone.js - Sound synthesis

### Setup
```bash
bun install
bun run dev
```

### Build
```bash
bun run build
```

### Deploy
Push to `main` branch to auto-deploy to GitHub Pages.

## Live Demo

https://ribeirolabs.github.io/games-finger-duel/
