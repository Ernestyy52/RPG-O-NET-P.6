import { describe, expect, it } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const music = ['bgm_boss.ogg', 'bgm_dungeon.ogg']
const sfx = [
  'sfx_footstep.wav', 'sfx_attack.wav', 'sfx_hit.wav', 'sfx_ui.wav', 'sfx_portal.wav',
  'sfx_battle_start.wav', 'sfx_elite_spawn.wav', 'sfx_victory.wav', 'sfx_rare_drop.wav',
]

describe('zone music and game SFX', () => {
  it('ships mobile Ogg Vorbis loops and valid PCM SFX', () => {
    for (const name of music) {
      const path = fileURLToPath(new URL(`../public/audio/${name}`, import.meta.url))
      expect(statSync(path).size, name).toBeGreaterThan(10_000)
      expect(readFileSync(path).subarray(0, 4).toString('ascii'), name).toBe('OggS')
    }
    for (const name of sfx) {
      const path = fileURLToPath(new URL(`../public/audio/${name}`, import.meta.url))
      expect(statSync(path).size, name).toBeGreaterThan(1000)
      expect(readFileSync(path).subarray(0, 4).toString('ascii'), name).toBe('RIFF')
    }
  })

  it('keeps source loops outside public and cuts each mobile download by at least 70%', () => {
    for (const name of ['bgm_boss', 'bgm_dungeon']) {
      const publicPath = fileURLToPath(new URL(`../public/audio/${name}.ogg`, import.meta.url))
      const sourcePath = fileURLToPath(new URL(`../assets/generated/audio-sources/${name}.wav`, import.meta.url))
      expect(statSync(sourcePath).size, name).toBeGreaterThan(600_000)
      expect(statSync(publicPath).size, name).toBeLessThan(statSync(sourcePath).size * 0.3)
    }
  })
})
