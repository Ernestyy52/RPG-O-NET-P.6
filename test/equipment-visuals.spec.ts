import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ALL_EQUIPMENT } from '~/data/equipment'
import {
  getEquipmentVisual,
  validateEquipmentVisuals,
  visualForItem,
  WEAPON_ANCHORS,
  type Facing,
} from '~/data/equipmentVisuals'

// กติกา Phase 3: ทุก equippable item ต้องมี visual mapping หรือ hidden พร้อมเหตุผล
// weapon ต้องเปลี่ยน sprite จริง (held-icon) และ anchor ครบ 4 ทิศ

const FACINGS: Facing[] = ['down', 'left', 'right', 'up']

describe('equipment visual registry', () => {
  it('covers every equippable item with a valid mapping (validator returns no problems)', () => {
    expect(validateEquipmentVisuals()).toEqual([])
    expect(ALL_EQUIPMENT.length).toBeGreaterThan(200)
  })

  it('all weapons render as held-icon with an icon file that exists on disk', () => {
    const weapons = ALL_EQUIPMENT.filter((it) => it.slot === 'weapon')
    expect(weapons.length).toBeGreaterThan(0)
    for (const w of weapons) {
      const v = getEquipmentVisual(w.id)!
      expect(v.mode, w.id).toBe('held-icon')
      const file = fileURLToPath(new URL(`../public/${v.iconPath}`, import.meta.url))
      expect(existsSync(file), `${w.id} → ${v.iconPath}`).toBe(true)
    }
  })

  it('weapon anchors define position/layering/flip for all four directions', () => {
    for (const f of FACINGS) {
      const a = WEAPON_ANCHORS[f]
      expect(a).toBeDefined()
      expect(typeof a.x).toBe('number')
      expect(typeof a.y).toBe('number')
      expect(typeof a.front).toBe('boolean')
    }
    // เดินขึ้น = อาวุธอยู่หลังตัว, ทิศอื่นอยู่หน้า (depth ordering ตามทิศ)
    expect(WEAPON_ANCHORS.up.front).toBe(false)
    expect(WEAPON_ANCHORS.down.front).toBe(true)
    // ซ้าย/ขวา ต้อง mirror กัน
    expect(WEAPON_ANCHORS.left.flipX).not.toBe(WEAPON_ANCHORS.right.flipX)
    expect(WEAPON_ANCHORS.left.x).toBe(-WEAPON_ANCHORS.right.x)
  })

  it('armor/trinket map to aura with an explicit hidden reason (no fake overlay)', () => {
    for (const it_ of ALL_EQUIPMENT.filter((i) => i.slot !== 'weapon')) {
      const v = getEquipmentVisual(it_.id)!
      expect(v.mode, it_.id).toBe('aura')
      expect(v.auraColor, it_.id).toBeTruthy()
      expect(v.hiddenReason, it_.id).toBeTruthy()
    }
  })

  it('visualForItem is deterministic and stable per item id', () => {
    const sample = ALL_EQUIPMENT[0]!
    expect(visualForItem(sample)).toEqual(visualForItem(sample))
    expect(getEquipmentVisual('no_such_item')).toBeUndefined()
  })
})
