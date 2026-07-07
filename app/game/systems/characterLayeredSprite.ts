// เธฃเธฐเธเธ Layered Character Sprite
// ------------------------------------------------------------------
// เนเธเนเธเธชเธเธฃเธดเธ•เธซเธฅเธฑเธเธ—เธตเนเธกเธตเธญเธขเธนเนเนเธฅเนเธง (hero_idle_<class>/hero_walk_<class>, 4 เธ—เธดเธจ x idle/walk) เน€เธเนเธเธเธฑเธเธเธฅเธฒเธ "body" (เธฃเธงเธกเธฃเนเธฒเธเธเธฒเธข/เธเธฃเธฃเธเธฒเธเธฒเธฃเธเธทเนเธเธเธฒเธเธเธญเธเธ•เธฑเธงเธฅเธฐเธเธฃเนเธ•เนเธฅเธฐเธเธฅเธฒเธชเนเธเนเธเนเธเธ•เธฑเธง)
// เนเธฅเนเธงเธ‹เนเธญเธเธเธฑเธเธเธฅเธฒเธ equipment เน€เธเธดเนเธก (weapon/outfit/accessory เธฏเธฅเธฏ) เน€เธเนเธเธเธฑเธ Image เธ—เธตเนเธ•เธดเธ”เธ•เธฒเธกเธ•เธณเนเธซเธเนเธเธเธ body เธ—เธธเธเน€เธ—เธฃเธก
//
// เธซเธเธฒเธขเน€เธซเธ•เธธเธ—เธตเนเนเธกเนเนเธเน sprite sheet เนเธขเธเธเธฑเธ 7 เน€เธฅเนเธขเนเธญเธฃเนเธ•เธฒเธก animation state เธ—เธฑเนเธ 5 เธเธฒเธ: เธเธฃเธณเธเธฃเธ—เธเธฃเธดเธเธเธเธเธฃเธฃเธก/เธเธฒเธ‡เธเนเธเธ/เนเธชเธทเนเธญเธเนเธเนเธเนเธกเนเธกเธตเนเธเนเธเธเธฅเธฑเธเนเธเนเธเน€เธเนเธเธเน€เธเธเธเธฐเธ•เธฃเธเธเธฑเธ Character Asset เธ—เธตเนเธกเธตเนเธซเน
// (D:\Asset\Main Character Asset เน€เธเนเธเธเธฒเธ portrait/icon เนเธกเนเนเธเนเน sprite sheet เธ—เธดเธจเธ—เธฒเธ+animation) เธเธถเธเธเธฒเธกเธเนเธญเธเธณเธซเธเธ”: เธเธฅเธฒเธ body เนเธเน sprite sheet เน€เธ”เธดเธก (เธกเธตเธเธฃเธเธ—เธธเธ state/direction เธญเธขเธนเนเนเธฅเนเธง)
// เธชเนเธงเธเธเธฅเธฒเธเธญเธทเนเธเน† (weapon/outfit/hair/accessory) เนเธเนเนเธเน Image เธ•เธฒเธขเธ•เธฑเธง (เธซเธฃเธทเธ placeholder) เธ—เธตเนเธ•เธดเธ”เธ•เธฒเธก position/depth/flipX เธเธญเธ body เธ—เธธเธเน€เธเธฃเธก
// เนเธซเนเธ”เธนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเธ•เธฑเธง — เธ–เธทเธญเน€เธเนเธ visual sync (เธ•เธณเนเธซเธเน/เธ—เธดเธจเธ—เธฒเธ/เธเธฒเธเนเธเธเธเธฅเธฑเธ) เนเธกเนเนเธเน่ frame-perfect skeletal animation

import Phaser from 'phaser'
import type { CharacterAppearance, CharacterLayerName } from './characterAppearance'
import { defaultAppearance } from './characterAppearance'
import { visualForItemId, EquipmentVisualMap } from './equipmentVisualMap'
import type { EquipmentSlot } from '../../data/equipment'

export type CharAnimState = 'idle' | 'walk' | 'attack' | 'hurt' | 'death'
export type CharDirection = 'down' | 'up' | 'left' | 'right'

/** เธชเธ–เธฒเธเธฐเน€เธเธตเธขเธเธเธฒเธ ondation เธซเธเธถเนเธ เนเธซเนเธ—เธธเธเน€เธฅเธขเน€เธญเธฃเนเธญเนเธฒเธเธเนเธฒเธเธเนเธฒเธเธฃเนเธงเธก — เนเธกเนเนเธซเนเนเธ•เนเธฅเธฐเน€เธฅเธขเน€เธญเธฃเนเธกเธตเธ timer เธเธญเธเธ•เธฑเธงเน€เธญเธ */
export class CharacterAnimationController {
  state: CharAnimState = 'idle'
  direction: CharDirection = 'down'
  frameIndex = 0
  frameDuration = 100
  looping = true

  set(state: CharAnimState, direction: CharDirection) {
    this.state = state
    this.direction = direction
    this.looping = state !== 'attack' && state !== 'hurt' && state !== 'death'
  }
}

const EQUIP_SLOT_TO_LAYER: Record<EquipmentSlot, CharacterLayerName> = {
  weapon: 'weapon',
  armor: 'outfit',
  trinket: 'accessory',
}

/** เธฅเธณเธ”เธฑเธเธเธฒเธฃ render เธเธฒเธเธฅเนเธฒเธเนเธเธซเธฒเนเธเธ: body -> pants -> shoes -> outfit -> hair -> accessory -> weapon */
const LAYER_ORDER: CharacterLayerName[] = ['body', 'pants', 'shoes', 'outfit', 'hair', 'accessory', 'weapon']

const WEAPON_OFFSET: Record<CharDirection, { x: number; y: number; flip: boolean }> = {
  down: { x: 10, y: 4, flip: false },
  up: { x: -10, y: 4, flip: true },
  left: { x: -10, y: 2, flip: true },
  right: { x: 10, y: 2, flip: false },
}

export class CharacterLayeredSprite {
  private scene: Phaser.Scene
  private body: Phaser.Physics.Arcade.Sprite
  private container: Phaser.GameObjects.Container
  private layerImages: Partial<Record<CharacterLayerName, Phaser.GameObjects.Image>> = {}
  private appearance: CharacterAppearance = defaultAppearance()
  readonly anim = new CharacterAnimationController()

  constructor(scene: Phaser.Scene, body: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene
    this.body = body
    this.container = scene.add.container(body.x, body.y)
    this.container.setDepth(body.y)
  }

  setAppearance(newAppearance: CharacterAppearance) {
    this.appearance = { ...newAppearance }
    this.refreshCharacterVisuals()
  }

  equipVisual(slot: EquipmentSlot, itemId: string | null) {
    const layer = EQUIP_SLOT_TO_LAYER[slot]
    if (layer === 'weapon') this.appearance.weaponId = itemId
    else if (layer === 'outfit') this.appearance.outfitId = itemId
    else if (layer === 'accessory') this.appearance.accessoryId = itemId
    this.refreshCharacterVisuals()
  }

  unequipVisual(slot: EquipmentSlot) {
    this.equipVisual(slot, null)
  }

  refreshCharacterVisuals() {
    this.setLayer('outfit', this.appearance.outfitId)
    this.setLayer('accessory', this.appearance.accessoryId)
    this.setLayer('weapon', this.appearance.weaponId)
  }

  private setLayer(layer: CharacterLayerName, itemId: string | null) {
    const existing = this.layerImages[layer]
    existing?.destroy()
    delete this.layerImages[layer]
    if (!itemId) return

    const visual = visualForItemId(itemId)
    if (!visual) {
      console.warn(`[CharacterLayeredSprite] เนเธกเนเธเธเธเธฒเธเนเธ visual เธชเธณเธซเธฃเธฑเธ item id "${itemId}" — เนเธเนเธเธ layer "${layer}"`)
      return
    }

    const textureKey = visual.asset ? assetTextureKey(visual.asset) : visual.placeholderKey
    if (!textureKey || !this.scene.textures.exists(textureKey)) {
      console.warn(`[CharacterLayeredSprite] texture "${textureKey}" เธขเธฑเธเนเธกเนเนเธ”เน load — เนเธเนเธเธ layer "${layer}" (fallback: เนเธกเนเนเธชเธ”เธเธเธฅเธฒเธ)`)
      return
    }

    const img = this.scene.add.image(0, 0, textureKey)
    img.setScale(32 / img.width)
    this.layerImages[layer] = img
    this.rebuildContainerOrder()
  }

  private rebuildContainerOrder() {
    this.container.removeAll()
    for (const layer of LAYER_ORDER) {
      const img = this.layerImages[layer]
      if (img) this.container.add(img)
    }
  }

  /** เน€เธฃเธตเธขเธเธ—เธธเธ frame เธเธฒเธ TowerScene/TownScene.update() เธซเธฅเธฑเธเธเธฒเธ body sprite เธเธฅเธดเธเธ—เธดเธจเธ—เธฒเธ/เธ•เธณเนเธซเธเนเธ‡/anim เนเธฅเนเธง เน€เธเธทเนเธญเธชเนเธเธเธฃเธเธเนเธซเนเธ—เธธเธเน€เธฅเธขเน€เธญเธฃเนเธ•เธฒเธก body เนเธเน frame */
  sync(direction: CharDirection, state: CharAnimState) {
    this.anim.set(state, direction)
    this.container.setPosition(this.body.x, this.body.y)
    this.container.setDepth(this.body.y + 1)

    const weaponImg = this.layerImages.weapon
    if (weaponImg) {
      const offset = WEAPON_OFFSET[direction]
      weaponImg.setPosition(offset.x, offset.y)
      weaponImg.setFlipX(offset.flip)
      weaponImg.setDepth(2)
    }
    const outfitImg = this.layerImages.outfit
    if (outfitImg) {
      outfitImg.setFlipX(direction === 'left')
      outfitImg.setAlpha(0.85)
      outfitImg.setDepth(1)
    }
    const accessoryImg = this.layerImages.accessory
    if (accessoryImg) {
      accessoryImg.setPosition(-10, -14)
      accessoryImg.setDepth(3)
    }
  }

  destroy() {
    this.container.destroy()
  }
}

function assetTextureKey(assetPath: string): string {
  return `layerasset_${assetPath}`
}

export function preloadEquipmentVisualAssets(scene: Phaser.Scene, assetPath: (p: string) => string) {
  const seen = new Set<string>()
  for (const entry of Object.values(EquipmentVisualMap)) {
    if (!entry.asset || seen.has(entry.asset)) continue
    seen.add(entry.asset)
    const key = assetTextureKey(entry.asset)
    if (scene.textures.exists(key)) continue
    scene.load.image(key, assetPath(entry.asset))
  }
}
