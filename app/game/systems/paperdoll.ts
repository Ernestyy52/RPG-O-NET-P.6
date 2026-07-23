// Runtime paper-doll: outfit, headgear, shield and weapon frames follow the hero atlas exactly.
import Phaser from 'phaser'
import { assetPath } from './assetBase'
import {
  getEquipmentVisual,
  outfitFrameIndex,
  OUTFIT_ANCHORS,
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_WIDTH,
  type Facing,
  type PaperdollLayerSlot,
} from '../../data/equipmentVisuals'
import type { EquipmentSlot } from '../../data/equipment'

type EquipmentState = Partial<Record<EquipmentSlot, string>>
type Layer = {
  image?: Phaser.GameObjects.Image
  itemId: string
  visualPath: string
  loadingKey: string
  animated: boolean
}
type PlayerVisual = { x: number; y: number; depth: number; frame?: { name?: string | number } }

const ANIMATED_DISPLAY = { width: 32, height: 48 }

function layerDepth(slot: PaperdollLayerSlot, facing: Facing, playerDepth: number, front = true): number {
  if (slot === 'armor') return playerDepth + 0.35
  if (slot === 'head') return playerDepth + 1.6
  if (slot === 'weapon') return playerDepth + (facing === 'up' ? -1.3 : 1.45)
  if (slot === 'offhand') {
    if (facing === 'up' || facing === 'left') return playerDepth - 1.15
    return playerDepth + 1.2
  }
  return playerDepth + (front ? 1 : -1)
}

export class PaperdollOverlay {
  private layers: Record<PaperdollLayerSlot, Layer> = {
    weapon: { itemId: '', visualPath: '', loadingKey: '', animated: true },
    armor: { itemId: '', visualPath: '', loadingKey: '', animated: true },
    trinket: { itemId: '', visualPath: '', loadingKey: '', animated: false },
    head: { itemId: '', visualPath: '', loadingKey: '', animated: true },
    offhand: { itemId: '', visualPath: '', loadingKey: '', animated: true },
  }

  constructor(private scene: Phaser.Scene) {}

  update(player: PlayerVisual, facing: Facing, equipped: EquipmentState | string | undefined) {
    const state: EquipmentState = typeof equipped === 'string' || equipped === undefined ? { weapon: equipped } : equipped
    const weapon = state.weapon ? getEquipmentVisual(state.weapon) : undefined
    const armor = state.armor ? getEquipmentVisual(state.armor) : undefined
    const trinket = state.trinket ? getEquipmentVisual(state.trinket) : undefined

    this.syncLayer('weapon', state.weapon, weapon?.animationPath, true)
    this.syncLayer('offhand', state.weapon, weapon?.offhandAnimationPath, true)
    this.syncLayer('armor', state.armor, armor?.animationPath, true)
    this.syncLayer('head', state.armor, armor?.headAnimationPath, true)
    this.syncLayer('trinket', state.trinket, trinket?.iconPath, false)

    for (const slot of ['armor', 'offhand', 'weapon', 'head', 'trinket'] as PaperdollLayerSlot[]) {
      const layer = this.layers[slot]
      if (!layer.image || !layer.itemId) continue
      const visual = getEquipmentVisual(layer.itemId)
      const anchor = slot === 'trinket' ? visual?.anchors[facing] : OUTFIT_ANCHORS[facing]
      if (!anchor) { layer.image.setVisible(false); continue }
      if (layer.animated) layer.image.setFrame(outfitFrameIndex(facing, player.frame?.name))
      const bob = slot === 'trinket' ? Math.sin(this.scene.time.now / 260) * 1.5 : 0
      layer.image
        .setVisible(true)
        .setPosition(player.x + anchor.x, player.y + anchor.y + bob)
        .setFlipX(layer.animated ? false : anchor.flipX)
        .setAngle(layer.animated ? 0 : anchor.angle)
        .setDepth(layerDepth(slot, facing, player.depth, anchor.front))
        .setAlpha(1)
    }
  }

  private syncLayer(slot: PaperdollLayerSlot, itemId: string | undefined, visualPath: string | undefined, animated: boolean) {
    const layer = this.layers[slot]
    if (!itemId || !visualPath) {
      layer.itemId = ''
      layer.visualPath = ''
      layer.image?.setVisible(false)
      return
    }
    if (itemId === layer.itemId && visualPath === layer.visualPath) return
    layer.itemId = itemId
    layer.visualPath = visualPath
    layer.animated = animated
    const key = `paperdoll_${visualPath.replace(/[^a-z0-9]+/gi, '_')}`
    if (this.scene.textures.exists(key)) { this.apply(slot, key); return }
    if (layer.loadingKey === key) return
    layer.loadingKey = key
    if (animated) {
      this.scene.load.spritesheet(key, assetPath(visualPath), { frameWidth: OUTFIT_FRAME_WIDTH, frameHeight: OUTFIT_FRAME_HEIGHT })
      this.scene.load.once(`filecomplete-spritesheet-${key}`, () => this.completeLoad(slot, visualPath, key))
    } else {
      this.scene.load.image(key, assetPath(visualPath))
      this.scene.load.once(`filecomplete-image-${key}`, () => this.completeLoad(slot, visualPath, key))
    }
    if (!this.scene.load.isLoading()) this.scene.load.start()
  }

  private completeLoad(slot: PaperdollLayerSlot, visualPath: string, key: string) {
    if (this.layers[slot].visualPath === visualPath) this.apply(slot, key)
    this.layers[slot].loadingKey = ''
  }

  private apply(slot: PaperdollLayerSlot, textureKey: string) {
    const layer = this.layers[slot]
    if (!layer.image) layer.image = this.scene.add.image(0, 0, textureKey).setOrigin(0.5)
    else layer.image.setTexture(textureKey)
    if (layer.animated) layer.image.setDisplaySize(ANIMATED_DISPLAY.width, ANIMATED_DISPLAY.height)
    else layer.image.setDisplaySize(12, 12)
  }

  destroy() {
    for (const layer of Object.values(this.layers)) layer.image?.destroy()
  }
}

export { PaperdollOverlay as WeaponOverlay }
