// ระบบ BGM ประจำไบโอม/เมือง — เพลงจาก D:\Asset\Main Character Asset\Audio (copy-bgm.cjs)
// เล่นวนต่อเนื่องข้าม scene: เปลี่ยนเฉพาะตอนที่ track เปลี่ยน (เช่น เข้าไบโอมใหม่/เข้าเมือง)
import Phaser from 'phaser'

const VOLUME = 0.3
const REGISTRY_KEY = 'bgm:current'
const TRACKS = ['forest', 'desert', 'snow', 'volcano', 'cave', 'town'] as const
export type BgmKey = (typeof TRACKS)[number]

export function bgmKeyForBiome(biomeId: string): BgmKey {
  return (TRACKS as readonly string[]).includes(biomeId) ? (biomeId as BgmKey) : 'forest'
}

export function preloadBgm(scene: Phaser.Scene, key: BgmKey, assetPath: (p: string) => string) {
  const cacheKey = `bgm_${key}`
  if (scene.cache.audio.exists(cacheKey)) return
  scene.load.audio(cacheKey, assetPath(`audio/bgm_${key}.mp3`))
}

export function playBgm(scene: Phaser.Scene, key: BgmKey) {
  const cacheKey = `bgm_${key}`
  const current = scene.game.registry.get(REGISTRY_KEY) as string | undefined
  if (current === cacheKey) return // เพลงเดิม เล่นต่อเนื่องไม่ต้อง restart
  scene.game.sound.stopAll()
  if (!scene.cache.audio.exists(cacheKey)) return // โหลดไม่ทัน/ไฟล์หาย — เงียบไว้ ไม่ crash
  const track = scene.game.sound.add(cacheKey, { loop: true, volume: VOLUME })
  track.play()
  scene.game.registry.set(REGISTRY_KEY, cacheKey)
}
