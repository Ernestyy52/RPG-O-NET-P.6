import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import ffmpegPath from 'ffmpeg-static'

const SAMPLE_RATE = 22050
const outDir = resolve(import.meta.dirname, '../public/audio')
const sourceDir = resolve(import.meta.dirname, '../assets/generated/audio-sources')
await mkdir(outDir, { recursive: true })
await mkdir(sourceDir, { recursive: true })

function wav(samples) {
  const dataBytes = samples.length * 2
  const buffer = Buffer.alloc(44 + dataBytes)
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write('WAVE', 8)
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36); buffer.writeUInt32LE(dataBytes, 40)
  samples.forEach((value, index) => buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(value * 32767))), 44 + index * 2))
  return buffer
}

function render(seconds, generator) {
  const count = Math.floor(seconds * SAMPLE_RATE)
  return Array.from({ length: count }, (_, index) => generator(index / SAMPLE_RATE, index, count))
}

function noise(index) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const sounds = {
  'sfx_footstep.wav': render(0.09, (t, i) => noise(i) * Math.exp(-t * 42) * 0.28 + Math.sin(t * Math.PI * 2 * 92) * Math.exp(-t * 34) * 0.18),
  'sfx_attack.wav': render(0.2, (t, i) => (Math.sin(t * Math.PI * 2 * (680 - t * 2200)) * 0.35 + noise(i) * 0.18) * Math.exp(-t * 12)),
  'sfx_hit.wav': render(0.18, (t, i) => (noise(i) * 0.45 + Math.sin(t * Math.PI * 2 * 78) * 0.35) * Math.exp(-t * 18)),
  'sfx_ui.wav': render(0.08, (t) => Math.sin(t * Math.PI * 2 * 880) * Math.exp(-t * 40) * 0.26),
  'sfx_portal.wav': render(0.9, (t) => (Math.sin(t * Math.PI * 2 * (180 + t * 520)) * 0.22 + Math.sin(t * Math.PI * 2 * (360 + t * 240)) * 0.12) * Math.sin(Math.min(1, t * Math.PI)) * Math.exp(-t * 0.6)),
  'sfx_battle_start.wav': render(0.65, (t, i) => (Math.sin(t * Math.PI * 2 * (92 + t * 45)) * 0.32 + noise(i) * 0.08) * Math.sin(Math.min(1, t * 8)) * Math.exp(-t * 2.4)),
  'sfx_elite_spawn.wav': render(0.8, (t) => (Math.sin(t * Math.PI * 2 * 73.42) + 0.55 * Math.sin(t * Math.PI * 2 * 110)) * Math.sin(Math.min(1, t * 7)) * Math.exp(-t * 1.8) * 0.26),
  'sfx_victory.wav': render(1.25, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    const step = Math.min(3, Math.floor(t / 0.26))
    const local = t - step * 0.26
    return Math.sin(local * Math.PI * 2 * notes[step]) * Math.exp(-local * 4.2) * 0.28
  }),
  'sfx_rare_drop.wav': render(1.35, (t) => {
    const notes = [659.25, 987.77, 1318.51]
    return notes.reduce((sum, frequency, index) => {
      const start = index * 0.19
      const local = t - start
      return local < 0 ? sum : sum + Math.sin(local * Math.PI * 2 * frequency) * Math.exp(-local * 3.3) * 0.16
    }, 0)
  }),
}

for (const [name, samples] of Object.entries(sounds)) await writeFile(resolve(outDir, name), wav(samples))

const bossSeconds = 16
const boss = render(bossSeconds, (t, i, count) => {
  const beat = t % 0.5
  const kick = Math.sin(beat * Math.PI * 2 * (76 - beat * 80)) * Math.exp(-beat * 20) * 0.28
  const pulse = Math.sin(t * Math.PI * 2 * 55) * (0.13 + 0.05 * Math.sin(t * Math.PI * 2 * 0.25))
  const barNote = [110, 130.81, 98, 146.83][Math.floor(t / 2) % 4]
  const drone = Math.sin(t * Math.PI * 2 * barNote) * 0.1 + Math.sin(t * Math.PI * 2 * barNote * 1.5) * 0.045
  const tick = noise(i) * Math.exp(-(t % 0.25) * 55) * 0.035
  const edge = Math.min(1, i / 700, (count - i - 1) / 700)
  return (kick + pulse + drone + tick) * edge
})
await writeFile(resolve(sourceDir, 'bgm_boss.wav'), wav(boss))

const dungeonSeconds = 16
const dungeon = render(dungeonSeconds, (t, i, count) => {
  const root = [73.42, 65.41, 82.41, 61.74][Math.floor(t / 4) % 4]
  const drone = Math.sin(t * Math.PI * 2 * root) * 0.095 + Math.sin(t * Math.PI * 2 * root * 1.5) * 0.035
  const dripPhase = t % 1.75
  const drip = Math.sin(dripPhase * Math.PI * 2 * (720 - dripPhase * 210)) * Math.exp(-dripPhase * 8.5) * 0.06
  const air = noise(i) * (0.012 + 0.008 * Math.sin(t * Math.PI * 2 * 0.125))
  const distantBell = Math.sin(t * Math.PI * 2 * root * 4) * Math.exp(-(t % 4) * 2.6) * 0.025
  const edge = Math.min(1, i / 900, (count - i - 1) / 900)
  return (drone + drip + air + distantBell) * edge
})
await writeFile(resolve(sourceDir, 'bgm_dungeon.wav'), wav(dungeon))

const zoneLoops = ['bgm_boss', 'bgm_dungeon']
for (const name of zoneLoops) {
  const result = spawnSync(ffmpegPath, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', resolve(sourceDir, `${name}.wav`),
    '-c:a', 'libvorbis', '-q:a', '4',
    resolve(outDir, `${name}.ogg`),
  ], { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`OGG encoding failed for ${name} (exit ${result.status})`)
}

await writeFile(resolve(outDir, '_generated-audio-manifest.json'), `${JSON.stringify({
  generatedBy: 'scripts/build-procedural-audio.mjs',
  license: 'project-owned procedural audio',
  sampleRate: SAMPLE_RATE,
  files: [...Object.keys(sounds), 'bgm_boss.ogg', 'bgm_dungeon.ogg'],
  sourceFiles: zoneLoops.map((name) => `assets/generated/audio-sources/${name}.wav`),
  mobileCodec: 'Ogg Vorbis q4',
}, null, 2)}\n`, 'utf8')

console.log(`Built ${Object.keys(sounds).length} WAV SFX and two OGG zone loops in ${outDir}`)
