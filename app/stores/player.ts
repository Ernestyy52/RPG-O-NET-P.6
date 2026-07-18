import { defineStore } from 'pinia'
import { assetPath } from '~/game/systems/assetBase'
import { mitigateDamage } from '~/data/combat'
import { getHeroClass, type HeroClassId } from '~/data/classes'
import { findShopItem, getItemById, getEquipmentById, getRecipeByOutput, rarityColor, type EquipmentSlot, type Rarity } from '~/data/equipment'
import { rollDailyQuests, type DailyQuest, type QuestKind } from '~/data/quests'
import { SKILL_TREE, canLearnSkill } from '~/data/skills'
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

export type GenderId = 'male' | 'female'

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
  hp: number
  mp: number
  skillPoints: number
  learnedSkills: string[]
  inventory: Record<string, number>
  equipment: Partial<Record<EquipmentSlot, string>>
  /** sigils socketed per equipment slot (Phase 13 → flip #6). Additive; empty default, inert while SIGILS_ENABLED is off. */
  socketedSigils: SocketedSigils
  /** World-1 main quest progression (Phase 14 Inc 4). Additive; defaults to the chain start. */
  mainQuest: MainQuestState
  /** World-1 side-quest progress (id → count) + claimed ids (Phase 14 Inc 4). Additive; empty defaults. */
  sideQuestProgress: Record<string, number>
  sideQuestClaimed: string[]
  /** World-1 secrets discovered (Phase 14 Inc 4). Additive; empty default. */
  secretsFound: string[]
  /** Advanced job (Master Plan Phase 4). '' = ยังไม่เลือก; additive default. */
  jobId: '' | JobId
  /** Skill loadout 5+1 (Master Plan Phase 4). Additive; default = preset แรกของคลาส. */
  skillLoadout: SkillLoadout
  correctAnswers: number
  adventureLog: string[]
  dailyDate: string
  dailyQuests: DailyQuest[]
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
  secretsFound?: string[]
  jobId?: '' | JobId
  skillLoadout?: SkillLoadout
  classId?: HeroClassId
  restedExpPool?: number
  lastSeenAt?: number
  statAlloc?: StatAlloc
  level?: number
}): void {
  if (!store.socketedSigils) store.socketedSigils = {}
  if (!store.mainQuest) store.mainQuest = { ...INITIAL_MAIN_QUEST_STATE }
  if (!store.sideQuestProgress) store.sideQuestProgress = {}
  if (!store.sideQuestClaimed) store.sideQuestClaimed = []
  if (!store.secretsFound) store.secretsFound = []
  if (store.jobId === undefined) store.jobId = ''
  if (!store.skillLoadout || !Array.isArray(store.skillLoadout.skills) || store.skillLoadout.skills.length === 0) {
    store.skillLoadout = defaultSkillLoadout(store.classId ?? 'warrior')
  }
  if (typeof store.restedExpPool !== 'number' || !Number.isFinite(store.restedExpPool)) store.restedExpPool = 0
  if (typeof store.lastSeenAt !== 'number' || !Number.isFinite(store.lastSeenAt)) store.lastSeenAt = 0
  store.statAlloc = sanitizeAlloc(store.statAlloc, store.level ?? 1)
}

function addStats(base: Record<string, number>, stats?: Record<string, number | undefined>) {
  if (!stats) return
  for (const [key, value] of Object.entries(stats)) base[key] = (base[key] ?? 0) + (value ?? 0)
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
    hp: 72,
    mp: 30,
    skillPoints: 0,
    learnedSkills: [],
    inventory: { potion_s: 2 },
    equipment: {},
    socketedSigils: {},
    mainQuest: { ...INITIAL_MAIN_QUEST_STATE },
    sideQuestProgress: {},
    sideQuestClaimed: [],
    secretsFound: [],
    jobId: '',
    skillLoadout: defaultSkillLoadout('warrior'),
    correctAnswers: 0,
    adventureLog: [],
    dailyDate: '',
    dailyQuests: [],
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
      for (const id of state.learnedSkills) addStats(stats, SKILL_TREE.find((skill) => skill.id === id)?.stats)
      for (const id of Object.values(state.equipment)) {
        if (!id) continue
        const item = getItemById(id)
        addStats(stats, item?.kind === 'equipment' ? item.stats : undefined)
      }
      // Sigils (flip #6): socketed-sigil bonuses stack onto gear stats. Flag off ⇒ no-op (byte-identical).
      if (SIGILS_ENABLED) addStats(stats, totalSigilBonus(state.socketedSigils))
      // Stat allocation (RO-feel): แต้มที่ผู้เล่นกดเองบวกทับ growth. ไม่กด = โบนัสศูนย์ (byte-identical).
      if (STAT_ALLOC_ENABLED) addStats(stats, allocBonus(state.statAlloc))
      return {
        maxHp: Math.round(stats.hp),
        atk: Math.round(stats.atk),
        def: Math.round(stats.def),
        mag: Math.round(stats.mag),
        speed: Math.round(stats.speed),
        knowledge: Math.round(stats.knowledge),
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
      return order[best]
    },
    gearAuraColor(): string { return rarityColor(this.gearRarity) },
    /** แต้ม stat ที่ยังไม่ได้ใช้ (RO-feel) — คำนวณจากเลเวลเสมอ ไม่มี state ซ้ำซ้อนให้เพี้ยน */
    statPointsLeft: (state) => (STAT_ALLOC_ENABLED ? statPointsAvailable(state.level, state.statAlloc) : 0),
    atk(): number { return this.stats.atk },
    def(): number { return this.stats.def },
    speed(): number { return this.stats.speed },
    knowledge(): number { return this.stats.knowledge },
    consumables: (state) => Object.entries(state.inventory).filter(([, qty]) => qty > 0),
    // World-1 main quest (Inc 4): the active step + its progress, for HUD/quest UI.
    mainQuestStep: (state) => activeStep(state.mainQuest),
    mainQuestProgress: (state) => stepProgress(state.mainQuest),
    // World-1 side quests (Inc 4): each quest with its live progress/target/done/claimed, for the quest UI.
    sideQuests: (state) => WORLD1_SIDE_QUESTS.map((q) => {
      const progress = state.sideQuestProgress[q.id] ?? 0
      return { quest: q, progress, target: sideQuestTarget(q), done: isSideQuestDone(q, progress), claimed: state.sideQuestClaimed.includes(q.id) }
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
      this.skillPoints = 0
      this.learnedSkills = []
      this.jobId = ''
      this.skillLoadout = defaultSkillLoadout(payload.classId)
      this.inventory = { potion_s: 2 }
      this.equipment = {}
      this.socketedSigils = {}
      this.mainQuest = { ...INITIAL_MAIN_QUEST_STATE }
      this.sideQuestProgress = {}
      this.sideQuestClaimed = []
      this.secretsFound = []
      this.correctAnswers = 0
      this.adventureLog = []
      this.dailyDate = ''
      this.dailyQuests = []
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
        this.skillPoints += 1
        this.hp = this.maxHp
        this.mp = this.maxMp
        this.addLog(`Level up! You reached Lv.${this.level}.`)
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
      if (target === this.currentFloor) return
      const climbed = target > this.currentFloor
      this.currentFloor = target
      if (this.hp > this.maxHp) this.hp = this.maxHp
      if (climbed) this.progressQuest('climb', 1)
    },
    advanceFloor() {
      this.setFloor(this.currentFloor + 1)
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
      // side quests progress on the same events (rewards claimed manually — no auto-grant)
      for (const q of WORLD1_SIDE_QUESTS) {
        const cur = this.sideQuestProgress[q.id] ?? 0
        const nxt = advanceSideQuest(q, cur, event)
        if (nxt !== cur) this.sideQuestProgress[q.id] = nxt
      }
    },
    // Claim a completed side quest exactly once; grants the validated reward. Returns false otherwise.
    claimSideQuest(id: string) {
      if (this.sideQuestClaimed.includes(id)) return false
      const q = getSideQuest(id)
      if (!q || !isSideQuestDone(q, this.sideQuestProgress[id] ?? 0)) return false
      this.sideQuestClaimed.push(id)
      this.gainRewards(q.reward.exp, q.reward.gold, q.reward.gems)
      this.addLog(`Side quest complete: "${q.title}" (+${q.reward.gold}g${q.reward.gems ? `, +${q.reward.gems} gems` : ''}, +${q.reward.exp} EXP)`)
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
      for (const m of recipe.materials) this.inventory[m.id] -= m.qty
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
      for (const m of sigil.craftCost.materials) this.inventory[m.id] -= m.qty
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
      this.inventory[sigilId] -= 1
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
      return true
    },
    // ---- Master Plan Phase 4: advanced job + skill loadout (validate ก่อนรับเสมอ — UI ไม่ใช่ authority) ----
    chooseJob(jobId: JobId): boolean {
      if (this.level < JOB_UNLOCK_LEVEL) return false
      if (!jobsForClass(this.classId).some((j) => j.id === jobId)) return false
      this.jobId = jobId
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
      ensurePlayerDefaults(store)
      store.mp = Math.min(store.mp, store.maxMp)
      store.hp = Math.min(store.hp, store.maxHp)
    },
  },
})
