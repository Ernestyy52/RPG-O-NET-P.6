export type MonsterElement = 'neutral' | 'earth' | 'water' | 'fire' | 'wind' | 'holy' | 'shadow'
export type MonsterFamily = 'slime' | 'plant' | 'beast' | 'insect' | 'reptile' | 'spirit' | 'demon' | 'construct' | 'undead' | 'aquatic'

export interface MonsterEcologyProfile {
  id: string
  family: MonsterFamily
  element: MonsterElement
  weakness: MonsterElement
  habitat: string
  passive: string
  intents: string[]
  signatureDrop: string
  lore: string
}

const profiles: MonsterEcologyProfile[] = [
  { id: 'slime', family: 'slime', element: 'water', weakness: 'wind', habitat: 'Whisperleaf Meadow', passive: 'Gel Body: receives less damage from repeated basic attacks', intents: ['Bouncy Tackle', 'Split Guard'], signatureDrop: 'Elastic Gel', lore: 'A curious gel creature that gathers moisture and forgotten magic.' },
  { id: 'big_slime', family: 'slime', element: 'water', weakness: 'wind', habitat: 'Deepgrove', passive: 'Royal Gel: grows stronger below half HP', intents: ['Crushing Bounce', 'Gel Wave'], signatureDrop: 'Slime Crown Core', lore: 'An old slime whose core has condensed into a tiny crown.' },
  { id: 'nature_slime', family: 'slime', element: 'earth', weakness: 'fire', habitat: 'Mosswood Trail', passive: 'Photosynthesis: restores HP when a turn is delayed', intents: ['Vine Lash', 'Spore Coat'], signatureDrop: 'Verdant Nucleus', lore: 'A slime that became host to moss, seeds, and forest spirits.' },
  { id: 'mushroom_monster', family: 'plant', element: 'earth', weakness: 'fire', habitat: 'Rootcellar Hollow', passive: 'Toxic Spores: wrong answers may weaken healing', intents: ['Spore Burst', 'Cap Slam'], signatureDrop: 'Mooncap Spore', lore: 'It communicates through drifting spores and guards the roots below Aethergate.' },
  { id: 'frog_monster', family: 'beast', element: 'water', weakness: 'wind', habitat: 'Whisperleaf Meadow', passive: 'Spring Legs: high chance to act first', intents: ['Tongue Snap', 'High Leap'], signatureDrop: 'Resonant Vocal Sac', lore: 'A territorial frog whose calls echo before rainfall.' },
  { id: 'forest_lizard', family: 'reptile', element: 'earth', weakness: 'fire', habitat: 'Deepgrove', passive: 'Camouflage: first Break hit is reduced', intents: ['Tail Feint', 'Ambush Bite'], signatureDrop: 'Mossback Scale', lore: 'Its scales mimic bark so closely that veteran hunters still miss it.' },
  { id: 'scorpion', family: 'insect', element: 'earth', weakness: 'water', habitat: 'Sunstone Steppe', passive: 'Venom Tail: builds poison pressure', intents: ['Pincer Lock', 'Venom Sting'], signatureDrop: 'Sunstone Stinger', lore: 'A desert predator that stores solar heat in its shell.' },
  { id: 'sand_worm', family: 'beast', element: 'earth', weakness: 'water', habitat: 'Sunken Caravan', passive: 'Burrow: periodically avoids the next attack', intents: ['Sand Dive', 'Devouring Rush'], signatureDrop: 'Dune Heart', lore: 'A giant burrower drawn to the vibration of old caravan engines.' },
  { id: 'frost_sprite', family: 'spirit', element: 'water', weakness: 'fire', habitat: 'Frostveil Highlands', passive: 'Chill Aura: slows repeated skills', intents: ['Ice Needle', 'Whiteout'], signatureDrop: 'Frost Whisper', lore: 'A tiny spirit born where a snowflake touches ancient mana.' },
  { id: 'fire_slime', family: 'slime', element: 'fire', weakness: 'water', habitat: 'Ember Ridge', passive: 'Molten Core: attackers take light recoil', intents: ['Cinder Hop', 'Lava Splash'], signatureDrop: 'Ember Gel', lore: 'Its body never cools, even when carried far from the volcano.' },
  { id: 'bat', family: 'beast', element: 'shadow', weakness: 'holy', habitat: 'Crystal Depths', passive: 'Echolocation: punishes slow reactions', intents: ['Sonic Bite', 'Night Spiral'], signatureDrop: 'Echo Wing', lore: 'A cave bat that maps crystal tunnels through magical echoes.' },
  { id: 'wraith', family: 'undead', element: 'shadow', weakness: 'holy', habitat: 'Sunken Abyss', passive: 'Incorporeal: resists neutral damage', intents: ['Soul Chill', 'Phase Rend'], signatureDrop: 'Pale Memory', lore: 'A memory that refused to fade beneath the drowned citadel.' },
]

const byId = new Map(profiles.map((profile) => [profile.id, profile]))

function inferElement(id: string): MonsterElement {
  if (/fire|salamander|red_imp|magma|inferno/.test(id)) return 'fire'
  if (/frost|ice|snow|cumulus/.test(id)) return 'water'
  if (/wraith|banshee|shadow|reaper|mummy/.test(id)) return 'shadow'
  if (/frog|kraken/.test(id)) return 'water'
  if (/harpy|tengu|cockatrice/.test(id)) return 'wind'
  return 'earth'
}

function opposite(element: MonsterElement): MonsterElement {
  return ({ neutral: 'neutral', earth: 'fire', water: 'wind', fire: 'water', wind: 'earth', holy: 'shadow', shadow: 'holy' } as const)[element]
}

export function monsterEcology(id: string | undefined): MonsterEcologyProfile {
  const safeId = id || 'unknown_monster'
  const known = byId.get(safeId)
  if (known) return known
  const element = inferElement(safeId)
  return {
    id: safeId,
    family: /robot|golem/.test(safeId) ? 'construct' : /imp|gargoyle|minotaur|gorgon/.test(safeId) ? 'demon' : /snake|viper|basilisk|lizard/.test(safeId) ? 'reptile' : 'beast',
    element,
    weakness: opposite(element),
    habitat: 'Uncharted habitat',
    passive: `${element[0]!.toUpperCase()}${element.slice(1)} affinity: resists its native element`,
    intents: ['Measured Strike', 'Wild Assault'],
    signatureDrop: `${safeId.split('_').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ')} Essence`,
    lore: 'A regional species whose habits become clearer as the Monster Codex grows.',
  }
}

export function elementMultiplier(attack: MonsterElement, defender: MonsterElement): number {
  if (attack === 'neutral' || defender === 'neutral') return 1
  if (opposite(defender) === attack) return 1.25
  if (attack === defender) return 0.75
  return 1
}

export function codexTier(defeats: number): 0 | 1 | 2 | 3 | 4 {
  if (defeats >= 50) return 4
  if (defeats >= 20) return 3
  if (defeats >= 5) return 2
  if (defeats >= 1) return 1
  return 0
}

export const MONSTER_ELEMENTS: MonsterElement[] = ['neutral', 'earth', 'water', 'fire', 'wind', 'holy', 'shadow']
