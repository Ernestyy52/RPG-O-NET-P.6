// ================================================================================================
// Multiplayer client (Colyseus) — ห้องเมือง + ห้องดันเจี้ยนรายชั้น แบบ real-time
// ออกแบบให้ "ออฟไลน์ได้เสมอ": ไม่มี server URL หรือต่อไม่ติด → เกมเล่นคนเดียวตามปกติ ไม่มี error
// การเชื่อมต่อ/ส่งข้อความทั้งหมด no-op เมื่อไม่ได้ต่อ — ฉากเรียกใช้ได้โดยไม่ต้องเช็คสถานะเอง
// ================================================================================================
import { Client, Room } from 'colyseus.js'
import { gameEvents } from './eventBus'
import { COOP_ENABLED, COOP_MSG } from '~/data/coop'

export interface NetPlayer {
  x: number
  y: number
  facing: 'down' | 'left' | 'right' | 'up'
  moving: boolean
  status: 'idle' | 'battle'
  name: string
  classId: string
  gender: string
}

export interface NetMonster {
  slug: string
  x: number
  y: number
  alive: boolean
  /** sessionId ของคนที่กำลังสู้ตัวนี้ ('' = ว่าง) — instanced battle กันแย่งมอนสเตอร์ */
  lockedBy: string
}

/** ร่าง schema จริงจาก Colyseus มีเมธอด onChange ให้ subscribe delta patch รายตัว */
export type NetPlayerSchema = NetPlayer & { onChange: (cb: () => void) => void }
export type NetMonsterSchema = NetMonster & { onChange: (cb: () => void) => void }

export interface JoinProfile {
  name: string
  classId: string
  gender: string
  x: number
  y: number
}

let room: Room | null = null
let joining = false
let serverUrl = ''
const battleWaiters = new Map<string, (ok: boolean) => void>()

/** ตั้งค่า URL ของ Colyseus server (เรียกจาก GameCanvas ตอน mount — Phaser scene ใช้ Nuxt composable ตรงๆ ไม่ได้) */
export function setNetUrl(url: string) {
  serverUrl = url
}

export function isOnline(): boolean {
  return !!room
}

export function getRoom(): Room | null {
  return room
}

/** sessionId ของเราในห้องปัจจุบัน ('' = ออฟไลน์) */
export function mySessionId(): string {
  return room?.sessionId ?? ''
}

async function joinRoom(name: string, options: Record<string, unknown>): Promise<Room | null> {
  if (!serverUrl || room || joining) return room
  joining = true
  try {
    const client = new Client(serverUrl)
    // timeout กัน server ปลายทางเงียบ — เกินกำหนดถือว่าออฟไลน์ ไปต่อเลย
    const joined = await Promise.race([
      client.joinOrCreate(name, options),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ])
    if (!joined) return null
    room = joined as Room
    room.onLeave(() => { room = null })
    room.onError(() => { room = null })
    // ผลการขอสิทธิ์เข้าต่อสู้ (instanced battle lock) — จับคู่กับ requestBattle ผ่าน battleWaiters
    room.onMessage('battle:granted', (data: { id: string }) => battleWaiters.get(data.id)?.(true))
    room.onMessage('battle:denied', (data: { id: string }) => battleWaiters.get(data.id)?.(false))
    return room
  } catch {
    // server ไม่เปิด/เน็ตล่ม — เล่นออฟไลน์ต่อโดยไม่รบกวนผู้เล่น
    return null
  } finally {
    joining = false
  }
}

/** เข้าห้องเมือง — คืน null เงียบๆ ถ้าไม่มี URL/ต่อไม่ติด (เกมเล่นออฟไลน์ต่อได้) */
export async function joinTown(profile: JoinProfile): Promise<Room | null> {
  const joined = await joinRoom('town', profile)
  if (joined) gameEvents.emit('notice', { text: 'Online: connected to town server.' })
  return joined
}

/** เข้าห้องดันเจี้ยนของชั้นนั้น (server จับกลุ่มตาม floor อัตโนมัติ) */
export async function joinDungeon(profile: JoinProfile & { floor: number }): Promise<Room | null> {
  return joinRoom('dungeon', profile)
}

export function leaveRoom() {
  room?.leave()
  room = null
}

/** ส่งตำแหน่ง/ทิศ/กำลังเดิน (RemotePlayers throttle ~10 ครั้ง/วิ และส่งเฉพาะตอนค่าเปลี่ยน) */
export function sendMove(data: { x: number; y: number; facing: string; moving: boolean }) {
  room?.send('move', data)
}

export function sendStatus(status: 'idle' | 'battle') {
  room?.send('status', status)
}

/** ส่งรายการมอนสเตอร์ตั้งต้นให้ห้องดันเจี้ยน (server รับเฉพาะตอนห้องยังว่าง — คนแรกเป็นคน seed) */
export function sendSeed(monsters: { id: string; slug: string; x: number; y: number }[]) {
  room?.send('seed', monsters)
}

/**
 * ขอสิทธิ์สู้มอนสเตอร์ (server ล็อกกันแย่ง) — ออฟไลน์ = ได้เสมอ,
 * server เงียบเกิน 1.5 วิ = ปล่อยสู้ไปก่อน (อย่าให้เน็ตช้าบล็อกความสนุก)
 */
export function requestBattle(id: string): Promise<boolean> {
  if (!room) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => finish(true), 1500)
    const finish = (ok: boolean) => {
      clearTimeout(timer)
      battleWaiters.delete(id)
      resolve(ok)
    }
    battleWaiters.set(id, finish)
    room?.send('battle:request', { id })
  })
}

/** แจ้งผลศึกให้ server: ชนะ = มอนสเตอร์ตายทั้งห้อง / แพ้-หนี = ปลดล็อกให้คนอื่นสู้ต่อ */
export function sendBattleResult(id: string, won: boolean) {
  room?.send('battle:result', { id, won })
}

// ---- Safe co-op (Phase 15): the SERVER owns shared-encounter HP + reward claims. These are the client
// side of the coop protocol, DORMANT behind COOP_ENABLED so offline/flag-off is byte-identical (no send).
// Unlike the legacy client-trusted `battle:result`, victory + reward are decided server-side.

/** Report a validated hit on a shared co-op encounter; the server clamps + accumulates the real HP. */
export function sendCoopDamage(id: string, amount: number) {
  if (!COOP_ENABLED || !room) return
  room.send(COOP_MSG.damage, { id, amount })
}

/** Ask the server to grant this player's reward for a defeated co-op encounter (server checks the ledger). */
export function sendCoopClaim(id: string) {
  if (!COOP_ENABLED || !room) return
  room.send(COOP_MSG.claim, { id })
}

// สถานะต่อสู้ sync อัตโนมัติ: เพื่อนเห็นไอคอน ⚔ เหนือหัวเราตอนเราติดศึก
// (ลงทะเบียนครั้งเดียวระดับโมดูล — no-op เมื่อออฟไลน์)
gameEvents.on('battle:start', () => sendStatus('battle'))
gameEvents.on('battle:end', () => sendStatus('idle'))
