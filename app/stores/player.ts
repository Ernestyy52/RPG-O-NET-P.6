import { defineStore } from 'pinia'

export interface ShopItem {
  id: string
  name: string
  cost: number
  effect: { hpBonus?: number; atkBonus?: number }
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'sword1', name: 'Iron Sword', cost: 50, effect: { atkBonus: 3 } },
  { id: 'sword2', name: 'Steel Sword', cost: 150, effect: { atkBonus: 8 } },
  { id: 'armor1', name: 'Leather Armor', cost: 50, effect: { hpBonus: 15 } },
  { id: 'armor2', name: 'Chainmail', cost: 150, effect: { hpBonus: 40 } },
]

interface PlayerState {
  name: string
  level: number
  exp: number
  gold: number
  currentFloor: number
  maxHp: number
  hp: number
  atk: number
  inventory: string[]
}

function expToNextLevel(level: number): number {
  return Math.round(30 * Math.pow(level, 1.5))
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    name: 'Hero',
    level: 1,
    exp: 0,
    gold: 0,
    currentFloor: 1,
    maxHp: 50,
    hp: 50,
    atk: 5,
    inventory: [],
  }),
  getters: {
    expNeeded: (state) => expToNextLevel(state.level),
  },
  actions: {
    gainRewards(exp: number, gold: number) {
      this.exp += exp
      this.gold += gold
      while (this.exp >= expToNextLevel(this.level)) {
        this.exp -= expToNextLevel(this.level)
        this.level += 1
        this.maxHp += 10
        this.atk += 2
        this.hp = this.maxHp
      }
    },
    takeDamage(amount: number) {
      this.hp = Math.max(0, this.hp - amount)
    },
    heal() {
      this.hp = this.maxHp
    },
    advanceFloor() {
      this.currentFloor += 1
    },
    buyItem(itemId: string) {
      const item = SHOP_ITEMS.find((i) => i.id === itemId)
      if (!item || this.gold < item.cost || this.inventory.includes(itemId)) return false
      this.gold -= item.cost
      this.inventory.push(itemId)
      if (item.effect.hpBonus) {
        this.maxHp += item.effect.hpBonus
        this.hp += item.effect.hpBonus
      }
      if (item.effect.atkBonus) this.atk += item.effect.atkBonus
      return true
    },
  },
  persist: true,
})
