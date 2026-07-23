import Phaser from 'phaser'
import { gameEvents } from './eventBus'

const BASE_BGM_VOLUME = 0.34
const BASE_SFX_VOLUME = 0.72
const REGISTRY_TRACK = 'audio:bgm:key'
const REGISTRY_SOUND = 'audio:bgm:sound'
const REGISTRY_ENABLED = 'audio:enabled'
const REGISTRY_MUSIC = 'audio:music-volume'
const REGISTRY_SFX = 'audio:sfx-volume'
const TRACKS = ['forest', 'desert', 'snow', 'volcano', 'cave', 'town', 'dungeon', 'boss'] as const
const SFX = ['footstep', 'attack', 'hit', 'ui', 'portal', 'battle_start', 'elite_spawn', 'victory', 'rare_drop'] as const

export type BgmKey = (typeof TRACKS)[number]
export type SfxKey = (typeof SFX)[number]

export function bgmKeyForBiome(biomeId: string): BgmKey {
  return (TRACKS as readonly string[]).includes(biomeId) ? biomeId as BgmKey : 'forest'
}

function bgmFile(key: BgmKey): string {
  return key === 'boss' || key === 'dungeon' ? `audio/bgm_${key}.ogg` : `audio/bgm_${key}.mp3`
}

export function preloadBgm(scene: Phaser.Scene, key: BgmKey, path: (value: string) => string) {
  const cacheKey = `bgm_${key}`
  if (!scene.cache.audio.exists(cacheKey)) scene.load.audio(cacheKey, path(bgmFile(key)))
  for (const sfx of SFX) {
    const sfxKey = `sfx_${sfx}`
    if (!scene.cache.audio.exists(sfxKey)) scene.load.audio(sfxKey, path(`audio/${sfxKey}.wav`))
  }
}

function enabled(scene: Phaser.Scene): boolean {
  return scene.game.registry.get(REGISTRY_ENABLED) !== false
}

function musicVolume(scene: Phaser.Scene): number {
  return BASE_BGM_VOLUME * (scene.game.registry.get(REGISTRY_MUSIC) ?? 0.7)
}

function sfxVolume(scene: Phaser.Scene): number {
  return BASE_SFX_VOLUME * (scene.game.registry.get(REGISTRY_SFX) ?? 0.8)
}

export function playSfx(scene: Phaser.Scene, key: SfxKey, rate = 1) {
  const cacheKey = `sfx_${key}`
  if (!enabled(scene) || !scene.cache.audio.exists(cacheKey)) return
  scene.game.sound.play(cacheKey, { volume: sfxVolume(scene), rate })
}

function bindSceneSfx(scene: Phaser.Scene) {
  if (scene.data.get('audio:sfx-bound')) return
  scene.data.set('audio:sfx-bound', true)
  const handler = ({ key, rate }: { key: SfxKey; rate?: number }) => playSfx(scene, key, rate)
  gameEvents.on('audio:sfx', handler)
  scene.events.once('shutdown', () => gameEvents.off('audio:sfx', handler))
}

export function playBgm(scene: Phaser.Scene, key: BgmKey) {
  bindSceneSfx(scene)
  const cacheKey = `bgm_${key}`
  const currentKey = scene.game.registry.get(REGISTRY_TRACK) as string | undefined
  const currentSound = scene.game.registry.get(REGISTRY_SOUND) as Phaser.Sound.BaseSound | undefined
  if (currentKey === cacheKey && currentSound?.isPlaying) return
  currentSound?.stop()
  currentSound?.destroy()
  if (!enabled(scene) || !scene.cache.audio.exists(cacheKey)) {
    scene.game.registry.remove(REGISTRY_TRACK)
    scene.game.registry.remove(REGISTRY_SOUND)
    return
  }
  const sound = scene.game.sound.add(cacheKey, { loop: true, volume: musicVolume(scene) })
  sound.play()
  scene.game.registry.set(REGISTRY_TRACK, cacheKey)
  scene.game.registry.set(REGISTRY_SOUND, sound)
}

export function syncAudioSettings(game: Phaser.Game, settings: { sound: boolean; musicVolume?: number; sfxVolume?: number }) {
  game.registry.set(REGISTRY_ENABLED, settings.sound)
  game.registry.set(REGISTRY_MUSIC, settings.musicVolume ?? 0.7)
  game.registry.set(REGISTRY_SFX, settings.sfxVolume ?? 0.8)
  game.sound.mute = !settings.sound
  const current = game.registry.get(REGISTRY_SOUND) as Phaser.Sound.BaseSound | undefined
  if (current) {
    const adjustable = current as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound
    adjustable.setVolume(BASE_BGM_VOLUME * (settings.musicVolume ?? 0.7))
  }
}
