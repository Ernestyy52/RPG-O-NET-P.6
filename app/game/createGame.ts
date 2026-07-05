import Phaser from 'phaser'
import { TowerScene } from './scenes/TowerScene'

export function createGame(parent: HTMLElement, startFloor: number): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 480,
    height: 352,
    parent,
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [TowerScene],
  })
  game.scene.start('TowerScene', { floor: startFloor })
  return game
}
