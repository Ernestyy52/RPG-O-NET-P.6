import { defineStore } from 'pinia'
import { assetPath } from '~/game/systems/assetBase'
import { mitigateDamage } from '~/data/combat'
import { getHeroClass, type HeroClassId } from '~/data/classes'
import { findShopItem, getItemById, getEquipmentById, getRecipeByOutput, rarityColor, type EquipmentSlot, type Rarity } from '~/data/equipment'
import { activeEquipmentSets, equipmentSetForMonster, totalEquipmentSetBonus } from '~/data/equipmentSets'
import { activityCompleted, activityDateKey, dailyActivityPlan, type DailyActivityKind } from '~/data/activities'
import { rollDailyQuests, type DailyQuest, type QuestKind } from '~/data/quests'
import { SKILL_TREE, STARTING_SKILL_POINTS, canLearnSkill, skillPointsGrantedAtLevel, skillPointsSpent } from '~/data/skills'
import { defaultSkillLoadout } from '~/data/combat/builds'
import { validateLoadout } from '~/data/combat/loadoutEngine'
import { JOB_UNLOCK_LEVEL, jobsForClass, type JobId } from '~/data/combat/skillDefs'
import { RESTED_BONUS_ENABLED, accrueRested, consumeRested, hoursBetween } from '~/data/rested'
import {
  STAT_ALLOC_ENABLED, allocBonus, allocCost, canAllocate, sanitizeAlloc, statPointsAvailable,
  type AllocKey, type StatAlloc,
} from '~/data/statAllocation'

export interface SkillLoadout { skills: string[]; ultimate: string; passives: string[] }
import {
  SIGILS_ENABLED, getSigil, totalSigilBonus,
  socketSigil as socketSigilDomain, unsocketSigil as unsocketSigilDomain,
  type SocketedSigils,
} from '~/data/economy'
import {
  INITIAL_MAIN_QUEST_STATE, advanceMainQuest, activeStep, stepProgress,
  type MainQuestState, type QuestEvent,
} from '~/data/world1/quests'
import {
  WORLD1_SIDE_QUESTS, advanceSideQuest, isSideQuestDone, sideQuestTarget, getSideQuest,
} from '~/data/world1/sideQuests'
import { getWorld1Secret } from '~/data/world1/secrets'
import { WORLD1_HANDOFF_CONTRACT, completionRewardForRegion } from '~/data/world1/completion'
import { signatureGearForJob, starterEquipmentForClass } from '~/data/occupations'
import { regionForFloor, type AdventureRegionId } from '~/data/adventureRegions'
import { getAdventureZone, zoneForRank } from '~/data/adventureZones'
import { codexTier, monsterEcology } from '~/data/monsterEcology'
import { grantJobExp, grantMastery, jobExpToNext, masteryDamageBonus, weaponMasteryFamily, type WeaponMasteryFamily, type WeaponMasteryState } from '~/data/mmorpgProgression'
import { huntQualifies, rollHuntingBoard, type HuntingContract } from '~/data/huntingBoard'

export type GenderId = 'male' | 'female'
export type GameMode = 'adventure' | 'ranked-tower'

export interface MonsterCodexEntry {
  defeats: number
  eliteDefeats: number
  rareDefeats: number
  firstDefeatedAt: number
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

interface PlayerState {
  isAuthenticated: boolean
  accountName: string
  characterCreated: boolean
  name: string
  gender: GenderId
  classId: HeroClassId
  appearance: { face: string; hair: string; color: string }
  level: number
  exp: number
  gold: number
  gems: number
  currentFloor: number
  /** Highest campaign rank ever reached. Unlike currentFloor, travelling backward never lowers it. */
  adventureRank: number
  /** Adventure is the campaign; ranked-tower is an optional competitive challenge. */
  gameMode: GameMode
  adventureRegionId: AdventureRegionId
  /** Selected world node. currentFloor is the loaded zone rank; adventureRank is progression authority. */
  currentZoneId: string
  /** Idempotent campaign chapter clears; additive so future worlds can use the same contract. */
  completedRegionIds: AdventureRegionId[]
  /** Completion packages already granted; separate from clears so older completed saves can upgrade once. */
  claimedRegionRewardIds: AdventureRegionId[]
  rankedTowerBest: number
  rankedTowerRating: number
  rankedTowerRuns: number
  /** Per-monster shuffle bags persist across reloads, preventing repeated battle questions. */
  monsterQuestionHistory: Record<string, string[]>
  /** Parallel progression makes every hunt useful even after base-level milestones. */
  jobLevel: number
  jobExp: number
  weaponMastery: Partial<Record<WeaponMasteryFamily, WeaponMasteryState>>
  monsterCodex: Record<string, MonsterCodexEntry>
  huntingBoardDate: string
  huntingBoard: HuntingContract[]
  activeHuntId: string
  regionReputation: Partial<Record<AdventureRegionId, number>>
  hp: number
  mp: number
  skillPoints: number
  learnedSkills: string[]
  inventory: Record<string, number>
  setDropPity: Record<string, number>
  equipment: Partial<Record<EquipmentSlot, string>>
  /** sigils socketed per equipment slot (Phase 13 → flip #6). Additive; empty default, inert while SIGILS_ENABLED is off. */
  socketedSigils: SocketedSigils
  /** World-1 main quest progression (Phase 14 Inc 4). Additive; defaults to the chain start. */
  mainQuest: MainQuestState
  /** World-1 side-quest progress (id → count) + claimed ids (Phase 14 Inc 4). Additive; empty defaults. */
  sideQuestProgress: Record<string, number>
  sideQuestClaimed: string[]
  /** Side quests only progress after the player physically meets their giver. */
  sideQuestAccepted: string[]
  /** World-1 secrets discovered (Phase 14 Inc 4). Additive; empty default. */
  secretsFound: string[]
  /** Lessons completed by walking to a Guild Academy tutor. Additive and save-compatible. */
  academyLessonsCompleted: string[]
  /** Advanced job (Master Plan Phase 4). '' = ยังไม่เลือก; additive default. */
  jobId: '' | JobId
  /** Skill loadout 5+1 (Master Plan Phase 4). Additive; default = preset แรกของคลาส. */
  skillLoadout: SkillLoadout
  correctAnswers: number
  adventureLog: string[]
  dailyDate: string
  dailyQuests: DailyQuest[]
  /** Short-session MMORPG activities are locked to one floor and reset on the UTC day key. */
  dailyActivityDate: string
  dailyActivityFloor: number
  eliteHuntProgress: number
  eliteHuntClaimed: boolean
  rareSpawnProgress: number
  rareSpawnClaimed: boolean
  dailyRiftCleared: boolean
  dailyRiftClaimed: boolean
  /** Rested bonus (Master Plan Phase 8 — ethical retention). Additive; 0 defaults, inert while
   *  RESTED_BONUS_ENABLED is off. Pool of bonus combat EXP granted for time away — never a penalty. */
  restedExpPool: number
  /** ms epoch of the last rewarded play moment — measures absence for rested accrual. 0 = never. */
  lastSeenAt: number
  /** RO-inspired manual stat points (data/statAllocation.ts). Additive; empty default = โบนัสศูนย์
   *  ทุกอย่างเท่าเดิม จนกว่าผู้เล่นจะกดแต้มเองในหน้า Status. */
  statAlloc: StatAlloc
}

function expToNextLevel(level: number): number {
  return Math.round(30 * Math.pow(level, 1.45))
}

/**
 * Backfill Phase-14 additive fields on a hydrated store so a PRE-Phase-14 `player` blob (which lacks
 * them) loads with zero data loss and every getter/action is safe. Idempotent; only fills what's absent.
 * Exported so the save-compatibility gate can be tested directly (see test/player-store.spec.ts).
 */
export function ensurePlayerDefaults(store: {
  socketedSigils?: SocketedSigils
  mainQuest?: MainQuestState
  sideQuestProgress?: Record<string, number>
  sideQuestClaimed?: string[]
  sideQuestAccepted?: string[]
  secretsFound?: string[]
  jobId?: '' | JobId
  skillLoadout?: SkillLoadout
  classId?: HeroClassId
  restedExpPool?: number
  lastSeenAt?: number
  statAlloc?: StatAlloc
  setDropPity?: Record<string, number>
  level?: number
  currentFloor?: number
  dailyActivityDate?: string
  dailyActivityFloor?: number
  eliteHuntProgress?: number
  eliteHuntClaimed?: boolean
  rareSpawnProgress?: number
  rareSpawnClaimed?: boolean
  dailyRiftCleared?: boolean
  dailyRiftClaimed?: boolean
  gameMode?: GameMode
  adventureRegionId?: AdventureRegionId
  rankedTowerBest?: number
  rankedTowerRating?: number
  rankedTowerRuns?: number
  monsterQuestionHistory?: Record<string, string[]>
  currentZoneId?: string
  adventureRank?: number
  completedRegionIds?: AdventureRegionId[]
  claimedRegionRewardIds?: AdventureRegionId[]
  jobLevel?: number
  jobExp?: number
  weaponMastery?: Partial<Record<WeaponMasteryFamily, WeaponMasteryState>>
  monsterCodex?: Record<string, MonsterCodexEntry>
  huntingBoardDate?: string
  huntingBoard?: HuntingContract[]
  activeHuntId?: string
  regionReputation?: Partial<Record<AdventureRegionId, number>>
  academyLessonsCompleted?: string[]
}): void {
  if (!store.socketedSigils) store.socketedSigils = {}
  if (!store.setDropPity || typeof store.setDropPity !== 'object') store.setDropPity = {}
  if (!store.mainQuest) store.mainQuest = { ...INITIAL_MAIN_QUEST_STATE }
  if (!store.sideQuestProgress) store.sideQuestProgress = {}
  if (!store.sideQuestClaimed) store.sideQuestClaimed = []
  if (!Array.isArray(store.sideQuestAccepted)) {
    store.sideQuestAccepted = WORLD1_SIDE_QUESTS.filter((quest) => (store.sideQuestProgress?.[quest.id] ?? 0) > 0 || store.sideQuestClaimed?.includes(quest.id)).map((quest) => quest.id)
  }
  if (!store.secretsFound) store.secretsFound = []
  if (!Array.isArray(store.academyLessonsCompleted)) store.academyLessonsCompleted = []
  if (store.jobId === undefined) store.jobId = ''
  if (!store.skillLoadout || !Array.isArray(store.skillLoadout.skills) || store.skillLoadout.skills.length === 0) {
    store.skillLoadout = defaultSkillLoadout(store.classId ?? 'warrior')
  }
  if (typeof store.restedExpPool !== 'number' || !Number.isFinite(store.restedExpPool)) store.restedExpPool = 0
  if (typeof store.lastSeenAt !== 'number' || !Number.isFinite(store.lastSeenAt)) store.lastSeenAt = 0
  store.statAlloc = sanitizeAlloc(store.statAlloc, store.level ?? 1)
  if (typeof store.dailyActivityDate !== 'string') store.dailyActivityDate = ''
  if (typeof store.dailyActivityFloor !== 'number' || !Number.isFinite(store.dailyActivityFloor)) store.dailyActivityFloor = store.currentFloor ?? 1
  if (typeof store.eliteHuntProgress !== 'number' || !Number.isFinite(store.eliteHuntProgress)) store.eliteHuntProgress = 0
  if (typeof store.eliteHuntClaimed !== 'boolean') store.eliteHuntClaimed = false
  if (typeof store.rareSpawnProgress !== 'number' || !Number.isFinite(store.rareSpawnProgress)) store.rareSpawnProgress = 0
  if (typeof store.rareSpawnClaimed !== 'boolean') store.rareSpawnClaimed = false
  if (typeof store.dailyRiftCleared !== 'boolean') store.dailyRiftCleared = false
  if (typeof store.dailyRiftClaimed !== 'boolean') store.dailyRiftClaimed = false
  if (store.gameMode !== 'adventure' && store.gameMode !== 'ranked-tower') store.gameMode = 'adventure'
  if (!store.adventureRegionId) store.adventureRegionId = regionForFloor(store.currentFloor ?? 1).id
  if (typeof store.rankedTowerBest !== 'number' || !Number.isFinite(store.rankedTowerBest)) store.rankedTowerBest = 0
  if (typeof store.rankedTowerRating !== 'number' || !Number.isFinite(store.rankedTowerRating)) store.rankedTowerRating = 1000
  if (typeof store.rankedTowerRuns !== 'number' || !Number.isFinite(store.rankedTowerRuns)) store.rankedTowerRuns = 0
  if (!store.monsterQuestionHistory || typeof store.monsterQuestionHistory !== 'object') store.monsterQuestionHistory = {}
  if (!store.currentZoneId) store.currentZoneId = zoneForRank(store.currentFloor ?? 1).id
  if (typeof store.jobLevel !== 'number' || !Number.isFinite(store.jobLevel)) store.jobLevel = 1
  if (typeof store.adventureRank !== 'number' || !Number.isFinite(store.adventureRank)) store.adventureRank = Math.max(1, store.currentFloor ?? 1)
  if (!Array.isArray(store.completedRegionIds)) store.completedRegionIds = []
  if (!Array.isArray(store.claimedRegionRewardIds)) store.claimedRegionRewardIds = []
  if (typeof store.jobExp !== 'number' || !Number.isFinite(store.jobExp)) store.jobExp = 0
  if (!store.weaponMastery || typeof store.weaponMastery !== 'object') store.weaponMastery = {}
  if (!store.monsterCodex || typeof store.monsterCodex !== 'object') store.monsterCodex = {}
  if (typeof store.huntingBoardDate !== 'string') store.huntingBoardDate = ''
  if (!Array.isArray(store.huntingBoard)) store.huntingBoard = []
  if (typeof store.activeHuntId !== 'string') store.activeHuntId = ''
  if (!store.regionReputation || typeof store.regionReputation !== 'object') store.regionReputation = {}
}

function addStats<T extends object>(base: Record<string, number>, stats?: T) {
  if (!stats) return
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number') base[key] = (base[key] ?? 0) + value
  }
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    isAuthenticated: false,
    accountName: '',
    characterCreated: false,
    name: '',
    gender: 'male',
    classId: 'warrior',
    appearance: { face: 'calm', hair: 'short', color: 'amber' },
    level: 1,
    exp: 0,
    gold: 90,
    gems: 0,
    currentFloor: 1,
    gameMode: 'adventure',
    adventureRegionId: 'verdant-frontier',
    adventureRank: 1,
    currentZoneId: 'aethergate',
    rankedTowerBest: 0,
    rankedTowerRating: 1000,
    completedRegionIds: [],
    claimedRegionRewardIds: [],
    rankedTowerRuns: 0,
    monsterQuestionHistory: {},
    jobLevel: 1,
    jobExp: 0,
    weaponMastery: {},
    monsterCodex: {},
    huntingBoardDate: '',
    huntingBoard: [],
    activeHuntId: '',
    regionReputation: {},
    hp: 72,
    mp: 30,
    skillPoints: 0,
    learnedSkills: [],
    inventory: { potion_s: 2 },
    setDropPity: {},
    equipment: {},
    socketedSigils: {},
    mainQuest: { ...INITIAL_MAIN_QUEST_STATE },
    sideQuestProgress: {},
    sideQuestClaimed: [],
    secretsFound: [],
    sideQuestAccepted: [],
    academyLessonsCompleted: [],
    jobId: '',
    skillLoadout: defaultSkillLoadout('warrior'),
    correctAnswers: 0,
    adventureLog: [],
    dailyDate: '',
    dailyQuests: [],
    dailyActivityDate: '',
    dailyActivityFloor: 1,
    eliteHuntProgress: 0,
    eliteHuntClaimed: false,
    rareSpawnProgress: 0,
    rareSpawnClaimed: false,
    dailyRiftCleared: false,
    dailyRiftClaimed: false,
    restedExpPool: 0,
    lastSeenAt: 0,
    statAlloc: {},
  }),
  getters: {
    heroClass: (state) => getHeroClass(state.classId),
    expNeeded: (state) => expToNextLevel(state.level),
    baseSprite: (state) => assetPath(state.gender === 'female' ? 'character-assets/base_female.png' : 'character-assets/base_male.png'),
    portraitSprite: (state) => assetPath(state.gender === 'female' ? 'character-assets/base_female.png' : 'character-assets/base_male.png'),
    displayName: (state) => state.name || 'Hero',
    stats: (state) => {
      const heroClass = getHeroClass(state.classId)
      const stats: Record<string, number> = { ...heroClass.base }
      const levelUps = Math.max(0, state.level - 1)
      addStats(stats, Object.fromEntries(Object.entries(heroClass.growth).map(([key, value]) => [key, value * levelUps])))
      for (const id of state.learnedSkills) addStats(stats, SKILL_TREE.find((skill) => skill.id === id && skill.classId === state.classId)?.stats)
      for (const id of Object.values(state.equipment)) {
        if (!id) continue
        const item = getItemById(id)
        addStats(stats, item?.kind === 'equipment' ? item.stats : undefined)
      }
      addStats(stats, totalEquipmentSetBonus(state.equipment))
      const weapon = state.equipment.weapon ? getEquipmentById(state.equipment.weapon) : undefined
      const masteryFamily = weaponMasteryFamily(weapon?.type)
      const masteryBonus = masteryDamageBonus(state.weaponMastery[masteryFamily]?.level ?? 1)
      if (masteryFamily === 'arcane') stats.mag = (stats.mag ?? 0) * (1 + masteryBonus)
      else stats.atk = (stats.atk ?? 0) * (1 + masteryBonus)
      // Sigils (flip #6): socketed-sigil bonuses stack onto gear stats. Flag off ⇒ no-op (byte-identical).
      if (SIGILS_ENABLED) addStats(stats, totalSigilBonus(state.socketedSigils))
      // Stat allocation (RO-feel): แต้มที่ผู้เล่นกดเองบวกทับ growth. ไม่กด = โบนัสศูนย์ (byte-identical).
      if (STAT_ALLOC_ENABLED) addStats(stats, allocBonus(state.statAlloc))
      return {
        maxHp: Math.round(stats.hp ?? 0),
        atk: Math.round(stats.atk ?? 0),
        def: Math.round(stats.def ?? 0),
        mag: Math.round(stats.mag ?? 0),
        speed: Math.round(stats.speed ?? 0),
        knowledge: Math.round(stats.knowledge ?? 0),
      }
    },
    maxHp(): number { return this.stats.maxHp },
    // MP = พลังสมาธิ ใช้กับสกิลในสนามรบ (Support/Counter) — โตตามเลเวลและค่า MAG
    maxMp(): number { return 20 + this.level * 4 + this.stats.mag * 3 },
    // ---- เครื่องแต่งกายที่สวมใส่ (paper-doll): ตัวละคร/พอร์เทรตเปลี่ยนตามของที่ใส่ ----
    equippedWeapon: (state) => (state.equipment.weapon ? getEquipmentById(state.equipment.weapon) : undefined),
    equippedArmor: (state) => (state.equipment.armor ? getEquipmentById(state.equipment.armor) : undefined),
    equippedTrinket: (state) => (state.equipment.trinket ? getEquipmentById(state.equipment.trinket) : undefined),
    // ความหายากสูงสุดในบรรดาของที่ใส่ → ใช้เป็นสี "ออร่า" รอบตัวละคร
    gearRarity(): Rarity {
      const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
      let best = 0
      for (const it of [this.equippedWeapon, this.equippedArmor, this.equippedTrinket]) {
        if (it) best = Math.max(best, order.indexOf(it.rarity))
      }
      return order[best] ?? 'common'
    },
    gearAuraColor(): string { return rarityColor(this.gearRarity) },
    gearSets: (state) => activeEquipmentSets(state.equipment),
    /** แต้ม stat ที่ยังไม่ได้ใช้ (RO-feel) — คำนวณจากเลเวลเสมอ ไม่มี state ซ้ำซ้อนให้เพี้ยน */
    statPointsLeft: (state) => (STAT_ALLOC_ENABLED ? statPointsAvailable(state.level, state.statAlloc) : 0),
    atk(): number { return this.stats.atk },
    def(): number { return this.stats.def },
    speed(): number { return this.stats.speed },
    knowledge(): number { return this.stats.knowledge },
    consumables: (state) => Object.entries(state.inventory).filter(([, qty]) => qty > 0),
    // World-1 main quest (Inc 4): the active step + its progress, for HUD/quest UI.
    currentRegion: (state) => regionForFloor(state.currentFloor),
    currentZone: (state) => getAdventureZone(state.currentZoneId),
    jobExpNeeded: (state) => jobExpToNext(state.jobLevel),
    activeHunt: (state) => state.huntingBoard.find((contract) => contract.id === state.activeHuntId),
    world1Completed: (state) => state.completedRegionIds.includes('verdant-frontier'),
    codexDiscovered: (state) => Object.values(state.monsterCodex).filter((entry) => entry.defeats > 0).length,
    currentWeaponMastery: (state) => {
      const weapon = state.equipment.weapon ? getEquipmentById(state.equipment.weapon) : undefined
      const family = weaponMasteryFamily(weapon?.type)
      return { family, ...(state.weaponMastery[family] ?? { level: 1, exp: 0 }) }
    },
    mainQuestStep: (state) => activeStep(state.mainQuest),
    mainQuestProgress: (state) => stepProgress(state.mainQuest),
    // World-1 side quests (Inc 4): each quest with its live progress/target/done/claimed, for the quest UI.
    dailyActivityPlan: (state) => dailyActivityPlan(
      state.dailyActivityDate || activityDateKey(),
      state.dailyActivityFloor || state.currentFloor,
    ),
    activityClaimable(): boolean {
      const plan = this.dailyActivityPlan
      return (!this.eliteHuntClaimed && this.eliteHuntProgress >= plan.eliteTarget)
        || (!this.rareSpawnClaimed && this.rareSpawnProgress >= plan.rareTarget)
        || (!this.dailyRiftClaimed && this.dailyRiftCleared)
    },
    sideQuests: (state) => WORLD1_SIDE_QUESTS.map((q) => {
      const progress = state.sideQuestProgress[q.id] ?? 0
      return { quest: q, progress, target: sideQuestTarget(q), done: isSideQuestDone(q, progress), claimed: state.sideQuestClaimed.includes(q.id), accepted: state.sideQuestAccepted.includes(q.id) }
    }),
  },
  actions: {
    login(accountName: string) {
      this.accountName = accountName.trim() || 'Player'
      this.isAuthenticated = true
    },
    logout() {
      this.isAuthenticated = false
    },
    createCharacter(payload: { name: string; gender: GenderId; classId: HeroClassId; face: string; hair: string; color: string }) {
      this.name = payload.name.trim() || 'Hero'
      this.gender = payload.gender
      this.classId = payload.classId
      this.appearance = { face: payload.face, hair: payload.hair, color: payload.color }
      this.level = 1
      this.exp = 0
      this.gold = 90
      this.gems = 0
      this.currentFloor = 1
      this.gameMode = 'adventure'
      this.adventureRegionId = 'verdant-frontier'
      this.adventureRank = 1
      this.currentZoneId = 'aethergate'
      this.rankedTowerBest = 0
      this.rankedTowerRating = 1000
      this.completedRegionIds = []
      this.claimedRegionRewardIds = []
      this.rankedTowerRuns = 0
      this.monsterQuestionHistory = {}
      this.jobLevel = 1
      this.jobExp = 0
      this.weaponMastery = {}
      this.monsterCodex = {}
      this.huntingBoardDate = ''
      this.huntingBoard = []
      this.activeHuntId = ''
      this.regionReputation = {}
      this.skillPoints = STARTING_SKILL_POINTS
      this.learnedSkills = []
      this.jobId = ''
      this.skillLoadout = defaultSkillLoadout(payload.classId)
      const starterEquipment = starterEquipmentForClass(payload.classId)
      this.inventory = { potion_s: 2, ...Object.fromEntries(Object.values(starterEquipment).map((id) => [id, 1])) }
      this.setDropPity = {}
      // The starter set is delivered to the bag so first-time stats/save contracts remain stable.
      // Players can equip its pieces immediately from Status, revealing the class paper-doll layers.
      this.equipment = {}
      this.socketedSigils = {}
      this.mainQuest = { ...INITIAL_MAIN_QUEST_STATE }
      this.sideQuestProgress = {}
      this.sideQuestClaimed = []
      this.secretsFound = []
      this.correctAnswers = 0
      this.sideQuestAccepted = []
      this.adventureLog = []
      this.dailyDate = ''
      this.dailyQuests = []
      this.dailyActivityDate = ''
      this.dailyActivityFloor = 1
      this.eliteHuntProgress = 0
      this.eliteHuntClaimed = false
      this.rareSpawnProgress = 0
      this.rareSpawnClaimed = false
      this.dailyRiftCleared = false
      this.dailyRiftClaimed = false
      this.statAlloc = {}
      this.characterCreated = true
      this.hp = this.maxHp
      this.mp = this.maxMp
    },
    /** กดแต้มใส่ attribute (RO-feel). คืน false เมื่อแต้มไม่พอ/คีย์ผิด — UI ปิดปุ่มตามนี้ */
    allocateStat(key: AllocKey): boolean {
      if (!STAT_ALLOC_ENABLED || !canAllocate(this.level, this.statAlloc, key)) return false
      this.statAlloc = { ...this.statAlloc, [key]: (this.statAlloc[key] ?? 0) + 1 }
      return true
    },
    /** ล้างแต้มทั้งหมด (ฟรี — นโยบายเดียวกับ Respec ของ skill tree: เด็ก ป.6 ทดลองได้ไม่กลัวพัง) */
    resetStatAllocation() {
      this.statAlloc = {}
      this.hp = Math.min(this.hp, this.maxHp)
      this.mp = Math.min(this.mp, this.maxMp)
    },
    /** ราคาแต้มถัดไปของ attribute นี้ (โชว์บนปุ่ม UI) */
    nextStatCost(key: AllocKey): number {
      return allocCost(this.statAlloc[key] ?? 0)
    },
    resetCharacter() {
      this.characterCreated = false
    },
    setClass(classId: HeroClassId) {
      this.classId = classId
      this.hp = this.maxHp
    },
    setGender(gender: GenderId) {
      this.gender = gender
    },
    setAppearance(key: 'face' | 'hair' | 'color', value: string) {
      this.appearance[key] = value
    },
    gainRewards(exp: number, gold: number, gems = 0) {
      this.exp += exp
      this.gold += gold
      this.gems += gems
      this.lastSeenAt = Date.now() // earning a reward = actively playing (absence measured from here)
      while (this.exp >= expToNextLevel(this.level)) {
        this.exp -= expToNextLevel(this.level)
        this.level += 1
        const gainedSkillPoints = skillPointsGrantedAtLevel(this.level)
        this.skillPoints += gainedSkillPoints
        this.hp = this.maxHp
        this.mp = this.maxMp
        this.addLog(`Level up! You reached Lv.${this.level} and gained ${gainedSkillPoints} skill point${gainedSkillPoints > 1 ? 's' : ''}.`)
      }
    },
    /** Combat rewards route through here so the rested pool can boost EXP (Phase 8 — ethical
     *  retention). Quest/secret rewards stay on plain gainRewards: rested boosts FIGHTING, not
     *  claiming. Flag off ⇒ identical to gainRewards. */
    gainCombatRewards(exp: number, gold: number, gems = 0) {
      if (RESTED_BONUS_ENABLED && this.restedExpPool > 0 && exp > 0) {
        const { bonus, remaining } = consumeRested(this.restedExpPool, exp)
        this.restedExpPool = remaining
        if (bonus > 0) this.addLog(`Rested bonus: +${bonus} EXP (${remaining} left in the pool).`)
        this.gainRewards(exp + bonus, gold, gems)
        return
      }
      this.gainRewards(exp, gold, gems)
    },
    /** Call once when a session starts: converts time away since lastSeenAt into rested pool.
     *  Grant-only — absence can only ADD (capped); a short gap or first session grants 0. */
    checkInRested(now = Date.now()) {
      if (!RESTED_BONUS_ENABLED) return
      const hoursAway = hoursBetween(this.lastSeenAt, now)
      const before = this.restedExpPool
      this.restedExpPool = accrueRested(this.restedExpPool, hoursAway, expToNextLevel(this.level))
      const gained = this.restedExpPool - before
      if (gained > 0) this.addLog(`You feel rested! +${gained} bonus EXP waits in your next fights.`)
      this.lastSeenAt = now
    },
    // ใช้ MP กับสกิลต่อสู้ — คืน false ถ้าไม่พอ (ปุ่มฝั่ง UI ควร disable ไว้ก่อนแล้ว)
    spendMp(amount: number) {
      if (this.mp < amount) return false
      this.mp -= amount
      return true
    },
    restoreMp(amount?: number) {
      this.mp = Math.min(this.maxMp, this.mp + (amount ?? this.maxMp))
    },
    // บันทึกเหตุการณ์ลง Adventure Log (เก็บล่าสุด 60 รายการ)
    addLog(text: string) {
      this.adventureLog.push(text)
      if (this.adventureLog.length > 60) this.adventureLog.splice(0, this.adventureLog.length - 60)
    },
    completeAcademyLesson(lessonId: string) {
      if (!lessonId || this.academyLessonsCompleted.includes(lessonId)) return false
      this.academyLessonsCompleted.push(lessonId)
      this.gainRewards(18, 6)
      this.addLog(`Guild Academy lesson mastered: ${lessonId} (+18 EXP, +6g).`)
      return true
    },
    takeDamage(amount: number) {
      // Defense mitigation lives in the combat domain (single source of truth, ADR 0002).
      this.hp = Math.max(0, this.hp - mitigateDamage(amount, this.def))
    },
    heal(amount?: number) {
      this.hp = Math.min(this.maxHp, this.hp + (amount ?? this.maxHp))
    },
    hospital() {
      const cost = Math.min(this.gold, Math.max(10, this.currentFloor * 3))
      this.gold -= cost
      this.heal()
      this.restoreMp()
    },
    /**
     * P0.1 — floor authority เดียวของทั้งเกม: scene/HUD/quest/save ต้องเรียกผ่านนี่เท่านั้น
     * clamp 1..100 และ idempotent (ตั้งซ้ำชั้นเดิมไม่มีผลข้างเคียง)
     */
    setFloor(destination: number) {
      const target = Math.max(1, Math.min(100, Math.round(destination)))
      const climbed = target > this.currentFloor
      if (this.gameMode === 'adventure') this.adventureRank = Math.max(this.adventureRank, target)
      if (target === this.currentFloor) return
      this.currentFloor = target
      if (this.gameMode === 'adventure') {
        this.adventureRegionId = regionForFloor(target).id
        this.currentZoneId = zoneForRank(target).id
      }
      if (this.hp > this.maxHp) this.hp = this.maxHp
      if (climbed) this.progressQuest('climb', 1)
    },
    advanceFloor() {
      this.setFloor(this.currentFloor + 1)
    },
    enterAdventureRegion(regionId: AdventureRegionId, destination: number) {
      this.gameMode = 'adventure'
      this.adventureRegionId = regionId
      this.setFloor(destination)
      this.addLog(`Travelled to ${regionForFloor(destination).name}.`)
    },
    enterAdventureZone(zoneId: string) {
      const zone = getAdventureZone(zoneId)
      this.gameMode = 'adventure'
      this.adventureRegionId = zone.regionId
      this.setFloor(zone.rank)
      this.currentZoneId = zone.id
      this.addLog(`Arrived at ${zone.name} (${zone.nameTh}).`)
    },
    enterRankedTower(startFloor = 1) {
      this.gameMode = 'ranked-tower'
      this.rankedTowerRuns += 1
      this.addLog(`Entered Endless Spire ranked run at floor ${Math.max(1, startFloor)}.`)
    },
    completeAdventureRegion(regionId: AdventureRegionId): boolean {
      let changed = false
      if (!this.completedRegionIds.includes(regionId)) {
        this.completedRegionIds.push(regionId)
        this.regionReputation[regionId] = Math.max(this.regionReputation[regionId] ?? 0, 100)
        this.addLog(regionId === 'verdant-frontier' ? 'World 1 complete: Verdant Frontier is safe.' : 'Region guardian defeated.')
        changed = true
      }

      if (regionId === WORLD1_HANDOFF_CONTRACT.regionId) {
        this.adventureRank = Math.max(this.adventureRank, WORLD1_HANDOFF_CONTRACT.completionRank)
      }
      const reward = completionRewardForRegion(regionId)
      if (reward && !this.claimedRegionRewardIds.includes(regionId)) {
        this.claimedRegionRewardIds.push(regionId)
        this.gainRewards(reward.exp, reward.gold, reward.gems)
        for (const item of reward.items) this.addItem(item.itemId, item.qty)
        this.hp = this.maxHp
        this.mp = this.maxMp
        this.addLog(`Region clear reward: +${reward.exp} EXP, +${reward.gold}g, +${reward.gems} gems, Verdant Relic secured.`)
        changed = true
      }
      return changed
    },
    recordRankedClear(floor: number, won = true) {
      if (!won) { this.rankedTowerRating = Math.max(0, this.rankedTowerRating - 8); return }
      this.rankedTowerBest = Math.max(this.rankedTowerBest, Math.max(1, Math.round(floor)))
      this.rankedTowerRating += 12 + Math.min(20, Math.floor(floor / 5))
    },
    recordMonsterQuestion(monsterId: string | undefined, questionId: string, resetCycle = false) {
      const key = monsterId || 'unknown-monster'
      const previous = resetCycle ? [] : (this.monsterQuestionHistory[key] ?? [])
      if (!previous.includes(questionId)) this.monsterQuestionHistory[key] = [...previous, questionId].slice(-80)
    },
    recordSetHunt(monsterId: string | undefined, gotSetDrop: boolean): number {
      const targetSet = equipmentSetForMonster(monsterId)
      if (!targetSet || !monsterId || this.currentFloor < targetSet.minFloor) return 0
      this.setDropPity[monsterId] = gotSetDrop ? 0 : (this.setDropPity[monsterId] ?? 0) + 1
      if (gotSetDrop) this.addLog(`Set hunt streak reset: ${targetSet.name} piece found.`)
      return this.setDropPity[monsterId]
    },
    addItem(itemId: string, qty = 1) {
      this.inventory[itemId] = (this.inventory[itemId] ?? 0) + qty
    },
    consumeItems(itemId: string, qty: number) {
      this.inventory[itemId] = Math.max(0, (this.inventory[itemId] ?? 0) - qty)
    },
    recordCorrectAnswer() {
      this.correctAnswers += 1
      // ตอบถูก = สมาธิกลับคืน เติม MP เล็กน้อย (ผูกความรู้เข้ากับทรัพยากรต่อสู้)
      this.mp = Math.min(this.maxMp, this.mp + 2)
      this.progressQuest('answer', 1)
      this.dispatchQuestEvent({ type: 'answer-correct' })
    },
    // เรียกตอนล้มมอนสเตอร์ (จาก BattleModal) — นับความคืบหน้าเควส "defeat"
    recordDefeat() {
      this.progressQuest('defeat', 1)
    },
    // ---- World-1 main quest (Inc 4): advance the chain on a real event; grant the completed step's
    // reward EXACTLY once (the reducer only completes each step a single time — idempotent + replay-safe).
    // Fed by: recordCorrectAnswer (answer), and index.vue bridges of floor:advance / battle:end /
    // town:guild|portal / dungeon:enter|clear. QuestModal renders the active step + log. ----
    dispatchQuestEvent(event: QuestEvent) {
      const res = advanceMainQuest(this.mainQuest, event)
      this.mainQuest = res.state
      if (res.completed) {
        this.gainRewards(res.completed.reward.exp, res.completed.reward.gold, res.completed.reward.gems)
        this.addLog(`Quest: "${res.completed.title}" complete! (+${res.completed.reward.gold}g${res.completed.reward.gems ? `, +${res.completed.reward.gems} gems` : ''}, +${res.completed.reward.exp} EXP)`)
      }
      // Side quests only progress after a physical conversation with their giver.
      for (const quest of WORLD1_SIDE_QUESTS) {
        if (!this.sideQuestAccepted.includes(quest.id)) continue
        const current = this.sideQuestProgress[quest.id] ?? 0
        const next = advanceSideQuest(quest, current, event)
        if (next !== current) this.sideQuestProgress[quest.id] = next
      }
    },
    acceptSideQuestsFromNpc(npcId: string) {
      const fresh = WORLD1_SIDE_QUESTS.filter((quest) => quest.npc === npcId && !this.sideQuestAccepted.includes(quest.id) && !this.sideQuestClaimed.includes(quest.id))
      for (const quest of fresh) {
        this.sideQuestAccepted.push(quest.id)
        this.sideQuestProgress[quest.id] = this.sideQuestProgress[quest.id] ?? 0
        this.addLog(`Side quest accepted from ${npcId}: "${quest.title}".`)
      }
      return fresh.length
    },
    // Claim a completed side quest exactly once; grants the validated reward. Returns false otherwise.
    claimSideQuest(id: string) {
      if (!this.sideQuestAccepted.includes(id) || this.sideQuestClaimed.includes(id)) return false
      const quest = getSideQuest(id)
      if (!quest || !isSideQuestDone(quest, this.sideQuestProgress[id] ?? 0)) return false
      this.sideQuestClaimed.push(id)
      this.gainRewards(quest.reward.exp, quest.reward.gold, quest.reward.gems)
      this.addLog(`Side quest complete: "${quest.title}" (+${quest.reward.gold}g${quest.reward.gems ? `, +${quest.reward.gems} gems` : ''}, +${quest.reward.exp} EXP)`)
      return true
    },
    // Discover a World-1 secret (Inc 4): grants its bounded reward ONCE and fires a find-secret quest
    // event. Double-guarded (scene + store) so overlap re-triggers can't duplicate the reward.
    discoverSecret(id: string) {
      if (this.secretsFound.includes(id)) return false
      const secret = getWorld1Secret(id)
      if (!secret) return false
      this.secretsFound.push(id)
      this.gainRewards(secret.reward.exp, secret.reward.gold, secret.reward.gems)
      if (secret.reward.itemId) this.addItem(secret.reward.itemId, secret.reward.qty ?? 1)
      this.dispatchQuestEvent({ type: 'find-secret', secretId: id })
      this.addLog(`Secret found: "${secret.name}"! (+${secret.reward.gold}g${secret.reward.gems ? `, +${secret.reward.gems} gems` : ''}, +${secret.reward.exp} EXP)`)
      return true
    },
    buyItem(itemId: string) {
      const item = findShopItem(this.currentFloor, itemId)
      if (!item || this.gold < item.cost) return false
      this.gold -= item.cost
      if (item.kind === 'equipment') {
        this.inventory[item.id] = 1
        this.equipment[item.slot] = item.id
        this.hp = Math.min(this.hp, this.maxHp)
      } else {
        this.addItem(item.id)
      }
      return true
    },
    useConsumable(itemId: string) {
      // ใช้ getItemById (ไม่ใช่ findShopItem) เพราะไอเทมในกระเป๋าอาจไม่อยู่ในร้านของชั้นนี้
      const item = getItemById(itemId)
      if (!item || item.kind !== 'consumable' || !this.inventory[itemId]) return false
      this.inventory[itemId] -= 1
      if (item.effect.heal) this.heal(item.effect.heal)
      if (item.effect.mp) this.restoreMp(item.effect.mp)
      return true
    },
    // สวมใส่ equipment ที่มีในกระเป๋า (ใช้กับของที่คราฟหรือดรอปได้)
    equipItem(itemId: string) {
      const item = getEquipmentById(itemId)
      if (!item || !this.inventory[itemId]) return false
      if (item.classId && item.classId !== this.classId) return false
      if (item.advancedJobId && item.advancedJobId !== this.jobId) return false
      this.equipment[item.slot] = item.id
      if (this.hp > this.maxHp) this.hp = this.maxHp
      return true
    },
    // คราฟไอเทมจากสูตร: หักวัสดุ+เงิน แล้วได้ของ (สวมให้อัตโนมัติ)
    craftItem(outputId: string) {
      const recipe = getRecipeByOutput(outputId)
      const output = getEquipmentById(outputId)
      if (!recipe || !output) return false
      if (this.gold < recipe.gold) return false
      for (const m of recipe.materials) if ((this.inventory[m.id] ?? 0) < m.qty) return false
      for (const m of recipe.materials) this.inventory[m.id] = (this.inventory[m.id] ?? 0) - m.qty
      this.gold -= recipe.gold
      this.addItem(output.id, 1)
      this.equipment[output.slot] = output.id
      this.addLog(`Crafted ${output.name}.`)
      return true
    },
    // ---- sigils (Phase 13 → flip #6): craft from materials+gold (deterministic, no gambling), socket
    // into equipped gear for a bounded stat bonus. Guarded by SIGILS_ENABLED so it's inert while off. ----
    craftSigil(sigilId: string) {
      if (!SIGILS_ENABLED) return false
      const sigil = getSigil(sigilId)
      if (!sigil || this.gold < sigil.craftCost.gold) return false
      for (const m of sigil.craftCost.materials) if ((this.inventory[m.id] ?? 0) < m.qty) return false
      for (const m of sigil.craftCost.materials) this.inventory[m.id] = (this.inventory[m.id] ?? 0) - m.qty
      this.gold -= sigil.craftCost.gold
      this.addItem(sigil.id, 1)
      this.addLog(`Crafted ${sigil.name}.`)
      return true
    },
    // socket a sigil from the inventory into an equipped slot (validated by the domain: cap + no dup).
    socketEquipmentSigil(slot: EquipmentSlot, sigilId: string) {
      if (!SIGILS_ENABLED || !this.equipment[slot] || (this.inventory[sigilId] ?? 0) < 1) return false
      const res = socketSigilDomain(this.socketedSigils[slot] ?? [], sigilId)
      if (!res.ok) return false
      this.socketedSigils[slot] = res.socketed
      this.inventory[sigilId] = (this.inventory[sigilId] ?? 0) - 1
      if (this.hp > this.maxHp) this.hp = this.maxHp // vigor sigils raise maxHp; keep hp ≤ max
      return true
    },
    // pull a socketed sigil back out — it returns to the inventory (reversible, no loss).
    unsocketEquipmentSigil(slot: EquipmentSlot, sigilId: string) {
      if (!SIGILS_ENABLED) return false
      const current = this.socketedSigils[slot] ?? []
      if (!current.includes(sigilId)) return false
      this.socketedSigils[slot] = unsocketSigilDomain(current, sigilId)
      this.addItem(sigilId, 1)
      if (this.hp > this.maxHp) this.hp = this.maxHp // maxHp may drop when a vigor sigil leaves
      return true
    },
    // ---- short-session daily activities ----
    refreshDailyActivities(date = activityDateKey()) {
      if (this.dailyActivityDate === date) return
      this.dailyActivityDate = date
      this.dailyActivityFloor = Math.max(1, Math.min(100, this.currentFloor))
      this.eliteHuntProgress = 0
      this.eliteHuntClaimed = false
      this.rareSpawnProgress = 0
      this.rareSpawnClaimed = false
      this.dailyRiftCleared = false
      this.dailyRiftClaimed = false
    },
    recordActivityVictory(payload: { elite?: boolean; rare?: boolean }) {
      this.refreshDailyActivities()
      const plan = dailyActivityPlan(this.dailyActivityDate, this.dailyActivityFloor)
      if (payload.elite) this.eliteHuntProgress = Math.min(plan.eliteTarget, this.eliteHuntProgress + 1)
      if (payload.rare) this.rareSpawnProgress = Math.min(plan.rareTarget, this.rareSpawnProgress + 1)
    },
    ensureHuntingBoard(date = todayKey()) {
      if (this.huntingBoardDate === date && this.huntingBoard.length === 3) return
      this.huntingBoardDate = date
      this.huntingBoard = rollHuntingBoard(date, this.adventureRegionId, this.currentFloor)
      this.activeHuntId = ''
    },
    acceptHunt(contractId: string): boolean {
      this.ensureHuntingBoard()
      const contract = this.huntingBoard.find((entry) => entry.id === contractId)
      if (!contract || contract.claimed) return false
      this.activeHuntId = contract.id
      this.addLog(`Hunting contract accepted: ${contract.targetName} (${contract.difficulty}).`)
      return true
    },
    claimHunt(contractId = this.activeHuntId): boolean {
      const contract = this.huntingBoard.find((entry) => entry.id === contractId)
      if (!contract || contract.claimed || contract.progress < contract.target) return false
      contract.claimed = true
      this.gainRewards(contract.reward.exp, contract.reward.gold, contract.reward.gems)
      this.addItem(contract.reward.itemId, contract.reward.itemQty)
      this.regionReputation[contract.regionId] = (this.regionReputation[contract.regionId] ?? 0) + (contract.difficulty === 'rare' ? 6 : contract.difficulty === 'elite' ? 3 : 2)
      this.addLog(`Hunting contract complete: ${contract.targetName}.`)
      if (this.activeHuntId === contract.id) this.activeHuntId = ''
      return true
    },
    recordMonsterVictory(payload: { monsterId?: string; elite?: boolean; rare?: boolean; expReward?: number }) {
      const monsterId = payload.monsterId || 'unknown_monster'
      const entry = this.monsterCodex[monsterId] ?? { defeats: 0, eliteDefeats: 0, rareDefeats: 0, firstDefeatedAt: Date.now() }
      entry.defeats += 1
      if (payload.elite) entry.eliteDefeats += 1
      if (payload.rare) entry.rareDefeats += 1
      this.monsterCodex[monsterId] = entry

      const jobGain = Math.max(4, Math.round((payload.expReward ?? this.currentFloor * 5) * 0.45))
      const jobResult = grantJobExp(this.jobLevel, this.jobExp, jobGain)
      if (jobResult.level > this.jobLevel) {
        this.skillPoints += jobResult.skillPoints
        this.addLog(`Job Level up! Job Lv.${jobResult.level} and +${jobResult.skillPoints} skill point${jobResult.skillPoints === 1 ? '' : 's'}.`)
      }
      this.jobLevel = jobResult.level
      this.jobExp = jobResult.exp

      const weapon = this.equipment.weapon ? getEquipmentById(this.equipment.weapon) : undefined
      const family = weaponMasteryFamily(weapon?.type)
      const previousMastery = this.weaponMastery[family]?.level ?? 1
      this.weaponMastery[family] = grantMastery(this.weaponMastery[family], payload.elite ? 5 : payload.rare ? 8 : 2)
      if (this.weaponMastery[family]!.level > previousMastery) this.addLog(`${family} mastery reached Lv.${this.weaponMastery[family]!.level}.`)

      this.ensureHuntingBoard()
      const active = this.huntingBoard.find((contract) => contract.id === this.activeHuntId)
      if (active && !active.claimed && huntQualifies(active, monsterId, payload.elite, payload.rare)) active.progress = Math.min(active.target, active.progress + 1)

      const tier = codexTier(entry.defeats)
      if ([1, 5, 20, 50].includes(entry.defeats)) {
        const profile = monsterEcology(monsterId)
        this.addLog(`Monster Codex tier ${tier}: ${profile.signatureDrop} research unlocked.`)
      }
      return { codexTier: tier, jobGain, masteryFamily: family }
    },
    completeDailyRift(date: string): boolean {
      if (!this.dailyActivityDate) this.refreshDailyActivities(date)
      if (date !== this.dailyActivityDate || this.dailyRiftCleared) return false
      this.dailyRiftCleared = true
      this.addLog('Daily Echo Rift cleared. Its reward is ready to claim.')
      return true
    },
    claimDailyActivity(kind: DailyActivityKind): boolean {
      if (!this.dailyActivityDate) this.refreshDailyActivities()
      const plan = dailyActivityPlan(this.dailyActivityDate, this.dailyActivityFloor)
      const progress = {
        eliteProgress: this.eliteHuntProgress,
        rareProgress: this.rareSpawnProgress,
        riftCleared: this.dailyRiftCleared,
      }
      if (!activityCompleted(kind, progress, plan)) return false
      const claimed = kind === 'elite' ? this.eliteHuntClaimed : kind === 'rare' ? this.rareSpawnClaimed : this.dailyRiftClaimed
      if (claimed) return false
      if (kind === 'elite') this.eliteHuntClaimed = true
      else if (kind === 'rare') this.rareSpawnClaimed = true
      else this.dailyRiftClaimed = true
      const reward = plan.rewards[kind]
      this.gainRewards(reward.exp, reward.gold, reward.gems)
      this.addLog(`Daily activity claimed: ${kind} (+${reward.exp} EXP, +${reward.gold}g${reward.gems ? `, +${reward.gems} gem` : ''}).`)
      return true
    },
    // ---- daily quests ----
    ensureDailyQuests() {
      const today = todayKey()
      if (this.dailyDate === today && this.dailyQuests.length) return
      this.dailyDate = today
      this.dailyQuests = rollDailyQuests(today, this.currentFloor)
    },
    progressQuest(kind: QuestKind, amount: number) {
      for (const q of this.dailyQuests) {
        if (q.kind === kind && !q.claimed) q.progress = Math.min(q.target, q.progress + amount)
      }
    },
    claimQuest(id: string) {
      const q = this.dailyQuests.find((quest) => quest.id === id)
      if (!q || q.claimed || q.progress < q.target) return false
      q.claimed = true
      this.gainRewards(q.reward.exp, q.reward.gold, q.reward.gems)
      this.addLog(`Quest complete: ${q.label} (+${q.reward.gold}g${q.reward.gems ? `, +${q.reward.gems} gems` : ''})`)
      return true
    },
    learnSkill(skillId: string) {
      const skill = SKILL_TREE.find((node) => node.id === skillId)
      if (!skill || skill.classId !== this.classId) return false
      if (!canLearnSkill(skill, this.learnedSkills, this.skillPoints)) return false
      this.skillPoints -= skill.cost
      this.learnedSkills.push(skillId)
      this.hp = Math.min(this.maxHp, this.hp + (skill.stats.hp ?? 0))
      this.addLog(`Talent upgraded: ${skill.name} (-${skill.cost} SP).`)
      return true
    },
    /** คืนแต้ม talent ทั้งหมดฟรี เพื่อให้ผู้เล่นทดลองบิลด์ได้โดยไม่กลัวตัวละครพัง */
    resetSkillTree(): number {
      const refundable = this.learnedSkills.filter((id) => SKILL_TREE.some((skill) => skill.id === id && skill.classId === this.classId))
      const refunded = skillPointsSpent(refundable)
      if (!refunded) return 0
      const refundSet = new Set(refundable)
      this.learnedSkills = this.learnedSkills.filter((id) => !refundSet.has(id))
      this.skillPoints += refunded
      this.hp = Math.min(this.hp, this.maxHp)
      this.mp = Math.min(this.mp, this.maxMp)
      this.addLog(`Talents reset: ${refunded} skill points refunded.`)
      return refunded
    },
    // ---- Master Plan Phase 4: advanced job + skill loadout (validate ก่อนรับเสมอ — UI ไม่ใช่ authority) ----
    chooseJob(jobId: JobId): boolean {
      if (this.level < JOB_UNLOCK_LEVEL) return false
      if (!jobsForClass(this.classId).some((j) => j.id === jobId)) return false
      this.jobId = jobId
      const signatureGear = signatureGearForJob(jobId)
      if (signatureGear && !this.inventory[signatureGear.id]) {
        this.addItem(signatureGear.id, 1)
        this.addLog(`Advanced job gift: ${signatureGear.name}.`)
      }
      // เปลี่ยน job แล้ว loadout เดิมอาจถือสกิลของ job เก่า — ถอยกลับ preset ของคลาส (เซฟห้ามถือ loadout ผิดกติกา)
      const lo = this.skillLoadout
      if (validateLoadout(lo.skills, lo.ultimate, lo.passives, this.classId, this.jobId || undefined).length > 0) {
        this.skillLoadout = defaultSkillLoadout(this.classId)
      }
      return true
    },
    setSkillLoadout(loadout: SkillLoadout): boolean {
      const problems = validateLoadout(loadout.skills, loadout.ultimate, loadout.passives, this.classId, this.jobId || undefined)
      if (problems.length > 0) return false
      this.skillLoadout = { skills: [...loadout.skills], ultimate: loadout.ultimate, passives: [...loadout.passives] }
      return true
    },
    /** Respec: กลับ preset แรกของคลาส (job คงไว้ — เปลี่ยน job ได้เสมอผ่าน chooseJob, ไม่มีค่าปรับ) */
    respecLoadout() {
      this.skillLoadout = defaultSkillLoadout(this.classId)
    },
  },
  persist: {
    // เซฟเก่าอาจมี mp เกิน maxMp ของคลาส (เช่น ค่า default 30 แต่ maxMp จริง 27) — clamp ตอนโหลด
    afterHydrate: ({ store }) => {
      // additive migration: a pre-Phase-14 blob lacks the new fields — backfill them so getters never
      // read undefined, then clamp hp/mp (a save may carry mp above the class's real maxMp).
      ensurePlayerDefaults(store.$state)
      // Older completed saves receive the deterministic clear package once; the separate claim list
      // makes repeated hydration and replayed boss events safe.
      for (const regionId of [...store.completedRegionIds]) store.completeAdventureRegion(regionId)
      store.mp = Math.min(store.mp, store.maxMp)
      store.hp = Math.min(store.hp, store.maxHp)
    },
  },
})

