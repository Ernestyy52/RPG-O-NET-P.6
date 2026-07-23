// ================================================================================================
// World graph + PlayerLocation (Phase 2 — Core Architecture, RO-inspired master prompt)
//
// จุดประสงค์: ให้ "ตำแหน่งผู้เล่น" และ "โครงโลก" เป็น data ที่ตรวจสอบได้ ก่อนการเปลี่ยนแมพครั้งใหญ่
//   • PlayerLocation — shape เดียวที่ contract ต้องการ (worldId/zoneId/spawnId/progressionRank/towerFloor)
//   • WORLD_GRAPH — โซนและพอร์ทัลที่มีอยู่จริงวันนี้ (สกัดจาก scene routing ปัจจุบัน ไม่ invent เพิ่ม)
//   • validateWorldGraph — edge ชี้ไปโซนจริง + ทุกโซนไปกลับเมืองได้ (no soft-lock ระดับโลก, BFS)
//
// px-level ZoneDefinition v2 (กำแพง/portal box/landmark ราย px) จะเติมเมื่อ mockup แมพชุดใหม่มาถึง
// — ดู docs/ZONE_CONTRACT.md ว่าแต่ละแมพต้องให้ข้อมูลอะไร
// ================================================================================================

export interface PlayerLocation {
  worldId: string
  zoneId: string
  spawnId: string
  /** ลำดับความคืบหน้า campaign (ตอนนี้ = currentFloor ของเซฟ; region ใหม่จะ map เพิ่ม) */
  progressionRank: number
  towerFloor?: number
}

export type ZoneKind = 'town' | 'interior' | 'tower' | 'dungeon' | 'arena'

export interface ZoneNode {
  id: string
  kind: ZoneKind
  name: string
  /** Phaser scene ที่ render โซนนี้วันนี้ (adapter — โซนใหม่หลายอันใช้ scene เดียวกันได้) */
  sceneKey: 'TownScene' | 'InteriorScene' | 'TowerScene' | 'DungeonScene' | 'BossScene'
}

export interface ZoneEdge {
  from: string
  to: string
  /** ผ่านอะไร (ป้ายบอกใน UI/debug) */
  via: string
  /** เงื่อนไขเปิดทาง (บันทึกเป็นคำอธิบาย — ตัวเช็คจริงอยู่ที่ scene/store เดิม) */
  requires?: string
}

// ---- โซนที่มีจริงวันนี้ (World 1) ---------------------------------------------------------------
// tower เป็น "โซนแม่แบบ" หนึ่ง node (ชั้น 2..10 ใช้ TowerScene เดียวกัน ต่างกันที่ floor param)
export const WORLD_GRAPH: { zones: ZoneNode[]; edges: ZoneEdge[] } = {
  zones: [
    { id: 'town', kind: 'town', name: 'Aethergate Town', sceneKey: 'TownScene' },
    { id: 'interior:hospital', kind: 'interior', name: 'Hospital', sceneKey: 'InteriorScene' },
    { id: 'interior:item-shop', kind: 'interior', name: 'Item Shop', sceneKey: 'InteriorScene' },
    { id: 'interior:equipment-shop', kind: 'interior', name: 'Equipment Shop', sceneKey: 'InteriorScene' },
    { id: 'interior:guild', kind: 'interior', name: 'Guild Hall', sceneKey: 'InteriorScene' },
    { id: 'tower', kind: 'tower', name: 'Tower Floors (2+)', sceneKey: 'TowerScene' },
    { id: 'dungeon:world01-mini', kind: 'dungeon', name: 'Rootcellar Hollow (F5)', sceneKey: 'DungeonScene' },
    { id: 'dungeon:world01-main', kind: 'dungeon', name: 'Citadel Approach (F10)', sceneKey: 'DungeonScene' },
    { id: 'arena:boss', kind: 'arena', name: 'Boss Arena', sceneKey: 'BossScene' },
  ],
  edges: [
    { from: 'town', to: 'interior:hospital', via: 'ประตูโรงพยาบาล' },
    { from: 'interior:hospital', to: 'town', via: 'ประตูออก' },
    { from: 'town', to: 'interior:item-shop', via: 'ประตูร้านของ' },
    { from: 'interior:item-shop', to: 'town', via: 'ประตูออก' },
    { from: 'town', to: 'interior:equipment-shop', via: 'ประตูร้านอุปกรณ์' },
    { from: 'interior:equipment-shop', to: 'town', via: 'ประตูออก' },
    { from: 'town', to: 'interior:guild', via: 'ประตูกิลด์' },
    { from: 'interior:guild', to: 'town', via: 'ประตูออก' },
    { from: 'town', to: 'tower', via: 'พอร์ทัล (Kael)', requires: 'ยืนยันกับผู้เฝ้าประตู' },
    { from: 'tower', to: 'town', via: 'town floor ทุก 10 ชั้น / แพ้บอส' },
    { from: 'tower', to: 'dungeon:world01-mini', via: 'ประตูดันเจี้ยนชั้น 5', requires: 'NEW_ZONE_RUNTIME_ENABLED' },
    { from: 'dungeon:world01-mini', to: 'tower', via: 'บันไดออก', requires: 'ล้ม elite ครบ' },
    { from: 'tower', to: 'dungeon:world01-main', via: 'ประตูดันเจี้ยนชั้น 10', requires: 'NEW_ZONE_RUNTIME_ENABLED' },
    { from: 'dungeon:world01-main', to: 'tower', via: 'บันไดออก', requires: 'ล้ม elite ครบ' },
    { from: 'dungeon:world01-main', to: 'arena:boss', via: 'Boss Gate', requires: 'ล้ม elite ครบ + เงื่อนไขบอส' },
    { from: 'tower', to: 'arena:boss', via: 'ประตูห้องบอส', requires: 'เงื่อนไขบอสของชั้น' },
    { from: 'arena:boss', to: 'tower', via: 'ชนะ = portal ขึ้นชั้นถัดไป / แพ้ = ฟื้นชั้นเดิม' },
  ],
}

/** แปลงสถานะเซฟปัจจุบัน (currentFloor) → PlayerLocation — adapter ระหว่างรอ zone-first save v6 */
export function locationFromFloor(floor: number): PlayerLocation {
  const isTown = floor % 10 === 1 || floor < 2
  return {
    worldId: 'world1',
    zoneId: isTown ? 'town' : 'tower',
    spawnId: 'default',
    progressionRank: floor,
    towerFloor: isTown ? undefined : floor,
  }
}

/** กติกาโครงโลกที่ห้ามละเมิด — test บังคับให้ว่าง */
export function validateWorldGraph(graph = WORLD_GRAPH): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const z of graph.zones) {
    if (ids.has(z.id)) problems.push(`${z.id}: duplicate zone id`)
    ids.add(z.id)
  }
  for (const e of graph.edges) {
    if (!ids.has(e.from)) problems.push(`edge ${e.from}→${e.to}: unknown source`)
    if (!ids.has(e.to)) problems.push(`edge ${e.from}→${e.to}: unknown target`)
  }
  // ทุกโซนต้อง "ไปถึงได้จากเมือง" และ "กลับเมืองได้" (no soft-lock ระดับโลก)
  const reach = (start: string, forward: boolean): Set<string> => {
    const seen = new Set<string>([start])
    const queue = [start]
    while (queue.length) {
      const cur = queue.shift()!
      for (const e of graph.edges) {
        const [a, b] = forward ? [e.from, e.to] : [e.to, e.from]
        if (a === cur && !seen.has(b)) { seen.add(b); queue.push(b) }
      }
    }
    return seen
  }
  const fromTown = reach('town', true)
  const toTown = reach('town', false)
  for (const z of graph.zones) {
    if (!fromTown.has(z.id)) problems.push(`${z.id}: unreachable from town`)
    if (!toTown.has(z.id)) problems.push(`${z.id}: cannot return to town (soft-lock)`)
  }
  return problems
}
