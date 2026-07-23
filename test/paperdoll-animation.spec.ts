import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  OUTFIT_FRAME_COLUMNS,
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_ROWS,
  OUTFIT_FRAME_WIDTH,
  outfitFrameIndex,
} from '~/data/equipmentVisuals'

const outfits = ['robe', 'leather', 'chain', 'plate', 'dragon']
const accessories = [
  ...outfits.map((family) => `head-${family}`),
  'shield-round', 'shield-kite', 'shield-arcane',
  'weapon-sword', 'weapon-greatsword', 'weapon-dagger', 'weapon-rapier',
  'weapon-axe', 'weapon-mace', 'weapon-spear', 'weapon-bow', 'weapon-crossbow',
  'weapon-staff', 'weapon-wand', 'weapon-scythe',
]

describe('directional paper-doll animation sheets', () => {
  it('maps all four directions and three source walk phases', () => {
    expect(outfitFrameIndex('down', 'warrior_male_down_0')).toBe(0)
    expect(outfitFrameIndex('down', 'warrior_male_down_1')).toBe(1)
    expect(outfitFrameIndex('down', 'warrior_male_down_2')).toBe(2)
    expect(outfitFrameIndex('left', 'warrior_male_left_0')).toBe(3)
    expect(outfitFrameIndex('right', 'warrior_male_right_0')).toBe(6)
    expect(outfitFrameIndex('up', 'warrior_male_up_2')).toBe(11)
  })

  it('ships five outfit sheets at the 3x4 alpha runtime contract', async () => {
    for (const family of outfits) {
      const file = fileURLToPath(new URL(`../public/paperdoll/animated/outfit-${family}-sheet.png`, import.meta.url))
      expect(existsSync(file), family).toBe(true)
      const metadata = await sharp(file).metadata()
      expect(metadata.width).toBe(OUTFIT_FRAME_WIDTH * OUTFIT_FRAME_COLUMNS)
      expect(metadata.height).toBe(OUTFIT_FRAME_HEIGHT * OUTFIT_FRAME_ROWS)
      expect(metadata.hasAlpha).toBe(true)
    }
  })

  it('ships 20 head, shield and weapon sheets with true left/right frames', async () => {
    expect(accessories).toHaveLength(20)
    for (const id of accessories) {
      const file = fileURLToPath(new URL(`../public/paperdoll/accessories/${id}-sheet.png`, import.meta.url))
      expect(existsSync(file), id).toBe(true)
      const metadata = await sharp(file).metadata()
      expect(metadata.width, id).toBe(OUTFIT_FRAME_WIDTH * OUTFIT_FRAME_COLUMNS)
      expect(metadata.height, id).toBe(OUTFIT_FRAME_HEIGHT * OUTFIT_FRAME_ROWS)
      expect(metadata.hasAlpha, id).toBe(true)
      const left = await sharp(file).extract({ left: 0, top: OUTFIT_FRAME_HEIGHT, width: OUTFIT_FRAME_WIDTH * OUTFIT_FRAME_COLUMNS, height: OUTFIT_FRAME_HEIGHT }).raw().toBuffer()
      const right = await sharp(file).extract({ left: 0, top: OUTFIT_FRAME_HEIGHT * 2, width: OUTFIT_FRAME_WIDTH * OUTFIT_FRAME_COLUMNS, height: OUTFIT_FRAME_HEIGHT }).raw().toBuffer()
      expect(left.equals(right), `${id}: left/right rows must be independently drawn`).toBe(false)
    }
  })
})
