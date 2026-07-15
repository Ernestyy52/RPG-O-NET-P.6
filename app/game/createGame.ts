import Phaser from 'phaser'
import type { HeroClassId } from '~/data/classes'
import { isTownFloor } from '~/data/floors'
import { TowerScene } from './scenes/TowerScene'
import { TownScene } from './scenes/TownScene'
import { BossScene } from './scenes/BossScene'
import { DungeonScene } from './scenes/DungeonScene'
import { InteriorScene } from './scenes/InteriorScene'

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
    // BUGFIX: ห้ามใส่ scene ใน config — Phaser จะ auto-start ตัวแรกเสมอ ทำให้ TownScene
    // ทำงานซ้อนกับ TowerScene ตลอดเวลา (physics/update ทำงานสองเท่า) — add แบบ autoStart=false แทน
  })
  game.scene.add('TownScene', TownScene, false)
  game.scene.add('TowerScene', TowerScene, false)
  game.scene.add('BossScene', BossScene, false)
  game.scene.add('DungeonScene', DungeonScene, false)
  game.scene.add('InteriorScene', InteriorScene, false)
  const startScene = isTownFloor(startFloor) ? 'TownScene' : 'TowerScene'
  game.scene.start(startScene, { floor: startFloor, classId })
  return game
}
