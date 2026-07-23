import Phaser from 'phaser'
import type { HeroClassId } from '~/data/classes'
import type { AdventureRegionId } from '~/data/adventureRegions'
import type { GameMode } from '~/stores/player'
import { isTownFloor } from '~/data/floors'
import { getAdventureZone } from '~/data/adventureZones'
import { chooseViewport, LEGACY_VIEWPORT } from './scaleContract'
import { TowerScene } from './scenes/TowerScene'
import { TownScene } from './scenes/TownScene'
import { BossScene } from './scenes/BossScene'
import { DungeonScene } from './scenes/DungeonScene'
import { InteriorScene } from './scenes/InteriorScene'

// ค่า default เดิม (640×480) คงไว้เป็น fallback/สำหรับโค้ดที่อ้างค่าคงที่ — ตัวเกมจริงเลือก
// viewport ตาม scale contract (S4): desktop 800×600 (เห็นโลก +25%/แกน) / มือถือแนวตั้ง 480×640
export const VIEWPORT_WIDTH = LEGACY_VIEWPORT.width
export const VIEWPORT_HEIGHT = LEGACY_VIEWPORT.height

export function createGame(
  parent: HTMLElement,
  startFloor: number,
  classId: HeroClassId,
  startMode: GameMode = 'adventure',
  regionId?: AdventureRegionId,
  zoneId?: string,
  world1QuestStep = 0,
): Phaser.Game {
  // เลือก internal viewport จากขนาด container จริง ณ ตอน boot (breakpoint เดียวกับ CSS หน้าเกม)
  const containerW = Math.round(parent.getBoundingClientRect().width) || window.innerWidth
  const view = chooseViewport(containerW)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: view.width,
    height: view.height,
    parent,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: view.width,
      height: view.height,
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
  const zone = startMode === 'adventure' ? getAdventureZone(zoneId) : undefined
  let startScene = startMode === 'adventure' && (zone?.kind === 'town' || (!zoneId && isTownFloor(startFloor))) ? 'TownScene' : 'TowerScene'
  let sceneData: Record<string, unknown> = { floor: startFloor, classId, mode: startMode, regionId, zoneId }
  if (startMode === 'adventure' && zone?.kind === 'dungeon') {
    startScene = 'DungeonScene'
    sceneData = { ...sceneData, layoutId: 'world01-mini', returnZoneId: 'mosswood-trail' }
  } else if (startMode === 'adventure' && zone?.kind === 'boss') {
    if (zone.id === 'myco-sanctum' && world1QuestStep < 11) {
      startScene = 'DungeonScene'
      sceneData = { ...sceneData, layoutId: 'world01-main', returnZoneId: 'deepgrove' }
    } else {
      startScene = 'BossScene'
    }
  }
  game.scene.start(startScene, sceneData)
  return game
}
