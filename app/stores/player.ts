import { defineStore } from 'pinia'
import { mitigateDamage } from '~/data/combat'
import { getHeroClass, type HeroClassId } from '~/data/classes'
import { findShopItem, getItemById, getEquipmentById, getRecipeByOutput, rarityColor, type EquipmentSlot, type Rarity } from '~/data/equipment'
import { rollDailyQuests, type DailyQuest, type QuestKind } from '~/data/quests'
import { SKILL_TREE, canLearnSkill } from '~/data/skills'

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
  correctAnswers: number
  adventureLog: string[]
  dailyDate: string
  dailyQuests: DailyQuest[]
}

function expToNextLevel(level: number): number {
  return Math.round(30 * Math.pow(level, 1.45))
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
    correctAnswers: 0,
    adventureLog: [],
    dailyDate: '',
    dailyQuests: [],
  }),
  getters: {
    heroClass: (state) => getHeroClass(state.classId),
    expNeeded: (state) => expToNextLevel(state.level),
    baseSprite: (state) => state.gender === 'female' ? '/character-assets/base_female.png' : '/character-assets/base_male.png',
    portraitSprite: (state) => state.gender === 'female' ? '/character-assets/base_female.png' : '/character-assets/base_male.png',
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
    atk(): number { return this.stats.atk },
    def(): number { return this.stats.def },
    speed(): number { return this.stats.speed },
    knowledge(): number { return this.stats.knowledge },
    consumables: (state) => Object.entries(state.inventory).filter(([, qty]) => qty > 0),
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
      this.inventory = { potion_s: 2 }
      this.equipment = {}
      this.correctAnswers = 0
      this.adventureLog = []
      this.dailyDate = ''
      this.dailyQuests = []
      this.characterCreated = true
      this.hp = this.maxHp
      this.mp = this.maxMp
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
      while (this.exp >= expToNextLevel(this.level)) {
        this.exp -= expToNextLevel(this.level)
        this.level += 1
        this.skillPoints += 1
        this.hp = this.maxHp
        this.mp = this.maxMp
        this.addLog(`Level up! You reached Lv.${this.level}.`)
      }
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
    advanceFloor() {
      this.currentFloor += 1
      if (this.hp > this.maxHp) this.hp = this.maxHp
      this.progressQuest('climb', 1)
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
    },
    // เรียกตอนล้มมอนสเตอร์ (จาก BattleModal) — นับความคืบหน้าเควส "defeat"
    recordDefeat() {
      this.progressQuest('defeat', 1)
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
  },
  persist: {
    // เซฟเก่าอาจมี mp เกิน maxMp ของคลาส (เช่น ค่า default 30 แต่ maxMp จริง 27) — clamp ตอนโหลด
    afterHydrate: ({ store }) => {
      store.mp = Math.min(store.mp, store.maxMp)
      store.hp = Math.min(store.hp, store.maxHp)
    },
  },
})
