import Phaser from 'phaser'
import type { HeroClassId } from '~/data/classes'
import { isTownFloor } from '~/data/floors'
import { TowerScene } from './scenes/TowerScene'
import { TownScene } from './scenes/TownScene'

export const VIEWPORT_WIDTH = 640
export const VIEWPORT_HEIGHT = 480

export function createGame(parent: HTMLElement, startFloor: number, classId: HeroClassId): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    parent,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    },
    render: { preserveDrawingBuffer: true },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [TownScene, TowerScene],
  })
  const startScene = isTownFloor(startFloor) ? 'TownScene' : 'TowerScene'
  game.scene.start(startScene, { floor: startFloor, classId })
  return game
}
