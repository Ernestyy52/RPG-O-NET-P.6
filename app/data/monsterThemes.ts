// ================================================================================================
// Themed dungeon monsters — each 10-floor "world" has a coherent, escalating roster + a world boss,
// aligned to the 5 biomes (which cycle every 10 floors). Sprites are the Main Character Asset monsters
// copied by scripts/sprite-crop/build-monsters.cjs (public/mob-sprites/mca/<slug>.png).
//
// Design goals (per request): a clear theme per band, sensible progression, never boring.
//   worlds 1-5  = the 5 biomes, "basic" rosters
//   worlds 6-10 = the same biomes revisited with tougher, distinct creatures (not a re-skin)
// ================================================================================================

export interface MonsterTheme {
  id: string
  name: string          // English
  nameTh: string        // Thai (shown on the floor banner)
  monsters: string[]    // mca slugs used as regular fodder for this world
  boss: string          // mca slug used as the per-floor mini-boss (non-milestone floors)
  bossScale: number     // display height target (px) for the mini-boss
}

// 10 worlds → floors 1-100
export const WORLD_THEMES: MonsterTheme[] = [
  { id: 'verdant', name: 'Verdant Slimes', nameTh: 'อาณาจักรสไลม์', monsters: ['slime', 'big_slime', 'nature_slime', 'mushroom_monster', 'frog_monster'], boss: 'big_slime', bossScale: 150 },
  { id: 'dunes', name: 'Scorching Dunes', nameTh: 'ทะเลทรายนักล่า', monsters: ['scorpion', 'snake', 'cactus_monster', 'sand_worm', 'cockatrice'], boss: 'sand_worm', bossScale: 150 },
  { id: 'frostwastes', name: 'Frozen Wastes', nameTh: 'ทุ่งน้ำแข็งเยือกเย็น', monsters: ['frost_sprite', 'snow_worm', 'fluffy_bear', 'ice_robot', 'cumulus'], boss: 'ice_robot', bossScale: 150 },
  { id: 'molten', name: 'Molten Fiends', nameTh: 'เหล่าปีศาจลาวา', monsters: ['fire_slime', 'fire_wisp', 'salamander', 'red_imp', 'thunder_slime'], boss: 'salamander', bossScale: 150 },
  { id: 'crystaldepths', name: 'Crystal Depths', nameTh: 'ห้วงคริสตัลลึกลับ', monsters: ['bat', 'black_imp', 'spider', 'clay_golem', 'shadow'], boss: 'cyclops', bossScale: 160 },
  { id: 'ancientgrove', name: 'Ancient Grove', nameTh: 'พงไพรดึกดำบรรพ์', monsters: ['treant', 'plant_behemoth', 'plant_sprite', 'dryad', 'mushroom_monster'], boss: 'plant_behemoth', bossScale: 170 },
  { id: 'cursedsands', name: 'Cursed Sands', nameTh: 'ผืนทรายต้องสาป', monsters: ['basilisk', 'viper', 'mummy', 'gorgon', 'minos'], boss: 'minotaur', bossScale: 165 },
  { id: 'frostpeak', name: 'Frostpeak Fortress', nameTh: 'ป้อมยอดเขาน้ำแข็ง', monsters: ['frost_sprite', 'tengu', 'harpy', 'snow_worm', 'golem'], boss: 'golem', bossScale: 165 },
  { id: 'infernal', name: 'Infernal Depths', nameTh: 'ห้วงนรกเพลิง', monsters: ['salamander', 'red_imp', 'gargoyle', 'fire_robot', 'reaper'], boss: 'reaper', bossScale: 165 },
  { id: 'abyss', name: 'The Sunken Abyss', nameTh: 'เหวลึกอสูร', monsters: ['wraith', 'banshee', 'shadow', 'spider', 'troll'], boss: 'kraken', bossScale: 175 },
]

export function worldIndexForFloor(floor: number): number {
  return Math.min(WORLD_THEMES.length - 1, Math.max(0, Math.floor((floor - 1) / 10)))
}

export function themeForFloor(floor: number): MonsterTheme {
  return WORLD_THEMES[worldIndexForFloor(floor)]
}

/** เธชเธธเนเธกเธกเธญเธเธชเน€เธ•เธญเธฃเนเธเธฃเธฐเธเธณเธเธฑเนเธเธเธฒเธ theme (deterministic-ish random เธ•เธฒเธก seed เธ‚เธญเธเธ•เธณเนเธซเธเธ‡) */
export function pickMonsterSlug(theme: MonsterTheme, rng: () => number): string {
  return theme.monsters[Math.floor(rng() * theme.monsters.length)]
}
