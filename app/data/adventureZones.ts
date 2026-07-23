import { ADVENTURE_REGIONS, getAdventureRegion, type AdventureRegionId } from './adventureRegions'
import { WORLD_THEMES } from './monsterThemes'

export type AdventureZoneKind = 'town' | 'field' | 'dungeon' | 'boss'

export interface AdventureZone {
  id: string
  regionId: AdventureRegionId
  name: string
  nameTh: string
  kind: AdventureZoneKind
  rank: number
  recommendedLevel: number
  description: string
  landmark: string
  monsterIds: string[]
  connections: string[]
}

const VERDANT_ZONES: AdventureZone[] = [
  { id: 'aethergate', regionId: 'verdant-frontier', name: 'Aethergate', nameTh: 'นครประตูอีเธอร์', kind: 'town', rank: 1, recommendedLevel: 1, description: 'เมืองเริ่มต้นที่รวมร้านค้า กิลด์ และเส้นทางออกล่า', landmark: 'Adventurer Guild', monsterIds: [], connections: ['whisperleaf-meadow'] },
  { id: 'whisperleaf-meadow', regionId: 'verdant-frontier', name: 'Whisperleaf Meadow', nameTh: 'ทุ่งใบไม้กระซิบ', kind: 'field', rank: 1, recommendedLevel: 1, description: 'ทุ่งเปิดสำหรับฝึกต่อสู้ เหมาะกับการล่า Slime และเก็บวัตถุดิบพื้นฐาน', landmark: 'Old Windmill', monsterIds: ['slime', 'frog_monster'], connections: ['aethergate', 'mosswood-trail'] },
  { id: 'mosswood-trail', regionId: 'verdant-frontier', name: 'Mosswood Trail', nameTh: 'ทางเดินป่ามอส', kind: 'field', rank: 5, recommendedLevel: 4, description: 'ทางป่าคดเคี้ยวที่มอนสเตอร์ซุ่มโจมตีและเริ่มใช้สถานะผิดปกติ', landmark: 'Moss Shrine', monsterIds: ['nature_slime', 'mushroom_monster'], connections: ['whisperleaf-meadow', 'deepgrove', 'rootcellar-hollow'] },
  { id: 'deepgrove', regionId: 'verdant-frontier', name: 'Deepgrove', nameTh: 'พงไพรชั้นใน', kind: 'field', rank: 8, recommendedLevel: 7, description: 'เขตล่าขั้นสูงของภูมิภาค ศัตรูเร็วขึ้นและมีของดรอปเฉพาะถิ่น', landmark: 'Moonroot Tree', monsterIds: ['big_slime', 'forest_lizard'], connections: ['mosswood-trail', 'myco-sanctum'] },
  { id: 'rootcellar-hollow', regionId: 'verdant-frontier', name: 'Rootcellar Hollow', nameTh: 'โพรงรากไม้', kind: 'dungeon', rank: 6, recommendedLevel: 6, description: 'ดันเจียนสั้นที่มีเส้นทางแตกแขนง กล่องสมบัติ และฝูงเห็ดพิษ', landmark: 'Heartroot Gate', monsterIds: ['mushroom_monster', 'nature_slime', 'forest_lizard'], connections: ['mosswood-trail', 'myco-sanctum'] },
  { id: 'myco-sanctum', regionId: 'verdant-frontier', name: 'Myco Sanctum', nameTh: 'วิหารราชันเห็ด', kind: 'boss', rank: 10, recommendedLevel: 10, description: 'รังของ Myco Colossus ผู้พิทักษ์ภูมิภาคและแหล่งอุปกรณ์ระดับสูง', landmark: 'Colossus Throne', monsterIds: ['mushroom_monster', 'big_slime'], connections: ['deepgrove', 'rootcellar-hollow'] },
]

function generatedRegionZones(regionIndex: number): AdventureZone[] {
  const region = ADVENTURE_REGIONS[regionIndex]!
  const theme = WORLD_THEMES[regionIndex]!
  const slug = region.id
  const monsters = theme.monsters
  const fieldRanks = [region.floorFrom, region.floorFrom + 4, region.floorFrom + 7]
  const fieldIds = [`${slug}-outskirts`, `${slug}-wilds`, `${slug}-depths`]
  return [
    { id: `${slug}-town`, regionId: region.id, name: region.town, nameTh: `เมือง${region.town}`, kind: 'town', rank: region.floorFrom, recommendedLevel: region.floorFrom, description: `ศูนย์กลางการเดินทางของ ${region.name}`, landmark: 'Wayfarer Plaza', monsterIds: [], connections: [fieldIds[0]!] },
    { id: fieldIds[0]!, regionId: region.id, name: `${region.field}: Outskirts`, nameTh: 'เขตรอบนอก', kind: 'field', rank: fieldRanks[0]!, recommendedLevel: fieldRanks[0]!, description: 'พื้นที่ล่าระดับต้นของภูมิภาค เหมาะสำหรับสำรวจสายพันธุ์และเก็บวัตถุดิบ', landmark: 'Frontier Camp', monsterIds: monsters.slice(0, 2), connections: [`${slug}-town`, fieldIds[1]!] },
    { id: fieldIds[1]!, regionId: region.id, name: `${region.field}: Wilds`, nameTh: 'เขตแดนป่า', kind: 'field', rank: fieldRanks[1]!, recommendedLevel: fieldRanks[1]!, description: 'พื้นที่ล่าระดับกลางที่มี Elite และเส้นทางเข้าสู่ดันเจียน', landmark: 'Hunter Camp', monsterIds: monsters.slice(1, 4), connections: [fieldIds[0]!, fieldIds[2]!, `${slug}-dungeon`] },
    { id: fieldIds[2]!, regionId: region.id, name: `${region.field}: Depths`, nameTh: 'เขตชั้นใน', kind: 'field', rank: fieldRanks[2]!, recommendedLevel: fieldRanks[2]!, description: 'พื้นที่ล่าระดับสูง มี Rare Spawn และของเฉพาะถิ่นที่ดีกว่า', landmark: 'Ancient Beacon', monsterIds: monsters.slice(-3), connections: [fieldIds[1]!, `${slug}-boss`] },
    { id: `${slug}-dungeon`, regionId: region.id, name: region.dungeon, nameTh: `ดันเจียน ${region.dungeon}`, kind: 'dungeon', rank: region.floorFrom + 5, recommendedLevel: region.floorFrom + 5, description: 'ดันเจียนประจำภูมิภาคที่มีเส้นทางและกลไกเฉพาะ', landmark: 'Dungeon Gate', monsterIds: monsters.slice(1), connections: [fieldIds[1]!, `${slug}-boss`] },
    { id: `${slug}-boss`, regionId: region.id, name: `${region.guardian}'s Domain`, nameTh: `รังของ ${region.guardian}`, kind: 'boss', rank: region.floorTo, recommendedLevel: region.floorTo, description: `สนามต่อสู้ของ ${region.guardian} ผู้พิทักษ์ ${region.name}`, landmark: 'Guardian Seal', monsterIds: [theme.boss], connections: [fieldIds[2]!, `${slug}-dungeon`] },
  ]
}

export const ADVENTURE_ZONES: AdventureZone[] = [
  ...VERDANT_ZONES,
  ...ADVENTURE_REGIONS.slice(1).flatMap((_, index) => generatedRegionZones(index + 1)),
]

export function getAdventureZone(id: string | undefined): AdventureZone {
  return ADVENTURE_ZONES.find((zone) => zone.id === id) ?? VERDANT_ZONES[0]!
}

export function zonesForRegion(regionId: AdventureRegionId): AdventureZone[] {
  return ADVENTURE_ZONES.filter((zone) => zone.regionId === regionId)
}

export function zoneForRank(rank: number): AdventureZone {
  const region = getAdventureRegion(ADVENTURE_REGIONS.find((entry) => rank >= entry.floorFrom && rank <= entry.floorTo)?.id)
  const regionZones = zonesForRegion(region.id)
  if (rank <= region.floorFrom) return regionZones.find((zone) => zone.kind === 'town') ?? regionZones[0]!
  const available = regionZones.filter((zone) => zone.kind !== 'town' && zone.rank <= rank)
  return available.sort((a, b) => b.rank - a.rank)[0] ?? regionZones[0]!
}

export function zoneUnlocked(zone: AdventureZone, adventureRank: number): boolean {
  return zone.kind === 'town' || adventureRank >= zone.rank
}

export function validateAdventureZones(): string[] {
  const errors: string[] = []
  const ids = new Set(ADVENTURE_ZONES.map((zone) => zone.id))
  for (const region of ADVENTURE_REGIONS) {
    const zones = zonesForRegion(region.id)
    if (zones.filter((zone) => zone.kind === 'field').length < 3) errors.push(`${region.id}: requires at least three fields`)
    for (const kind of ['town', 'dungeon', 'boss'] as const) if (!zones.some((zone) => zone.kind === kind)) errors.push(`${region.id}: missing ${kind}`)
  }
  for (const zone of ADVENTURE_ZONES) for (const connection of zone.connections) if (!ids.has(connection)) errors.push(`${zone.id}: missing connection ${connection}`)
  return errors
}
