// ================================================================================================
// SPIRAL'S ECHO — Colyseus realtime server (prototype ข้อ 3: ผู้เล่นเดินเห็นกันในเมือง)
//
// รัน local:  cd server && npm install && npm start   (ws://localhost:2567)
// deploy:     Render/Fly/Railway ก็ได้ — ตั้ง NUXT_PUBLIC_COLYSEUS_URL ฝั่งเว็บชี้มาที่ wss://...
//
// ขอบเขต prototype: server เก็บ state ห้องเมือง (ตำแหน่ง/ทิศ/สถานะผู้เล่น) และ broadcast
// ให้ทุก client แบบ delta-patch อัตโนมัติของ Colyseus — ยัง "เชื่อตำแหน่งจาก client" อยู่
// (clamp ขอบเขต + rate limit กันค่าหลุดโลกเท่านั้น) ขั้น production ค่อยย้าย movement
// มาคำนวณฝั่ง server เต็มรูปแบบ ดู docs/multiplayer.md
// ================================================================================================
const { Server, Room } = require('colyseus')
const { Schema, MapSchema, defineTypes } = require('@colyseus/schema')

const PORT = Number(process.env.PORT || 2567)
const WORLD_W = 1199 // ขนาดโลกเมือง (ภาพ town-night.png หลังสเกล) — ต้องตรงกับฝั่ง client
const WORLD_H = 608
const FACINGS = ['down', 'left', 'right', 'up']

class PlayerState extends Schema {}
defineTypes(PlayerState, {
  x: 'number',
  y: 'number',
  facing: 'string',
  moving: 'boolean',
  status: 'string', // 'idle' | 'battle' — ให้เพื่อนเห็นว่าเรากำลังสู้อยู่
  name: 'string',
  classId: 'string',
  gender: 'string',
})

class TownState extends Schema {
  constructor() {
    super()
    this.players = new MapSchema()
  }
}
defineTypes(TownState, { players: { map: PlayerState } })

class TownRoom extends Room {
  onCreate() {
    this.maxClients = 16
    this.setState(new TownState())
    this.setPatchRate(50) // broadcast 20 ครั้ง/วิ — ลื่นพอสำหรับเดินเมือง และเบา bandwidth

    this.onMessage('move', (client, data) => {
      const p = this.state.players.get(client.sessionId)
      if (!p || typeof data !== 'object' || !data) return
      // rate limit: สูงสุด ~20 ข้อความ/วิ ต่อคน
      const now = Date.now()
      const last = client.userData?.lastMove ?? 0
      if (now - last < 45) return
      client.userData = { ...client.userData, lastMove: now }

      p.x = Math.max(0, Math.min(WORLD_W, Number(data.x) || 0))
      p.y = Math.max(0, Math.min(WORLD_H, Number(data.y) || 0))
      p.facing = FACINGS.includes(data.facing) ? data.facing : p.facing
      p.moving = !!data.moving
    })

    this.onMessage('status', (client, data) => {
      const p = this.state.players.get(client.sessionId)
      if (p) p.status = data === 'battle' ? 'battle' : 'idle'
    })
  }

  onJoin(client, options = {}) {
    const p = new PlayerState()
    p.x = Math.max(0, Math.min(WORLD_W, Number(options.x) || 595))
    p.y = Math.max(0, Math.min(WORLD_H, Number(options.y) || 367))
    p.facing = 'down'
    p.moving = false
    p.status = 'idle'
    p.name = String(options.name || 'Hero').slice(0, 18)
    p.classId = ['warrior', 'mage', 'archer', 'guardian'].includes(options.classId) ? options.classId : 'warrior'
    p.gender = options.gender === 'female' ? 'female' : 'male'
    this.state.players.set(client.sessionId, p)
    console.log(`[town] ${p.name} joined (${this.clients.length}/${this.maxClients})`)
  }

  onLeave(client) {
    const p = this.state.players.get(client.sessionId)
    if (p) console.log(`[town] ${p.name} left`)
    this.state.players.delete(client.sessionId)
  }
}

// ---------------------------------------------------------------- Dungeon: ห้องรายชั้น + instanced battle
const DUNGEON_W = 768 // 24x18 tiles x 32px — ต้องตรงกับ TowerScene ฝั่ง client
const DUNGEON_H = 576

class MonsterState extends Schema {}
defineTypes(MonsterState, {
  slug: 'string',
  x: 'number',
  y: 'number',
  alive: 'boolean',
  lockedBy: 'string', // sessionId ของคนที่กำลังสู้ ('' = ว่าง) — กันแย่งมอนสเตอร์กัน
})

class DungeonState extends Schema {
  constructor() {
    super()
    this.players = new MapSchema()
    this.monsters = new MapSchema()
  }
}
defineTypes(DungeonState, { players: { map: PlayerState }, monsters: { map: MonsterState } })

class DungeonRoom extends Room {
  onCreate(options = {}) {
    this.maxClients = 8
    this.floor = Number(options.floor) || 2
    this.setState(new DungeonState())
    this.setPatchRate(50)
    this.seeded = false
    this.velocities = new Map() // ความเร็วมอนสเตอร์ (ไม่ต้อง sync — sync เฉพาะตำแหน่ง)
    this.deadAt = new Map()     // id -> เวลาที่ตาย (ไว้ respawn หลัง 10 วิ)
    this.respawnSeq = 0

    // client คนแรก seed รายการมอนสเตอร์ (slug/ตำแหน่ง จาก theme ของชั้น — server ไม่มีไฟล์ data ฝั่งเกม)
    this.onMessage('seed', (client, list) => {
      if (this.seeded || !Array.isArray(list)) return
      this.seeded = true
      for (const m of list.slice(0, 60)) {
        const mon = new MonsterState()
        mon.slug = String(m.slug || 'slime').slice(0, 40)
        mon.x = Math.max(64, Math.min(DUNGEON_W - 64, Number(m.x) || 100))
        mon.y = Math.max(128, Math.min(DUNGEON_H - 64, Number(m.y) || 200))
        mon.alive = true
        mon.lockedBy = ''
        this.state.monsters.set(String(m.id), mon)
      }
      console.log(`[dungeon:${this.floor}] seeded ${this.state.monsters.size} monsters`)
    })

    this.onMessage('move', (client, data) => {
      const p = this.state.players.get(client.sessionId)
      if (!p || typeof data !== 'object' || !data) return
      const now = Date.now()
      const last = client.userData?.lastMove ?? 0
      if (now - last < 45) return
      client.userData = { ...client.userData, lastMove: now }
      p.x = Math.max(0, Math.min(DUNGEON_W, Number(data.x) || 0))
      p.y = Math.max(0, Math.min(DUNGEON_H, Number(data.y) || 0))
      p.facing = FACINGS.includes(data.facing) ? data.facing : p.facing
      p.moving = !!data.moving
    })

    this.onMessage('status', (client, data) => {
      const p = this.state.players.get(client.sessionId)
      if (p) p.status = data === 'battle' ? 'battle' : 'idle'
    })

    // instanced battle: ล็อกมอนสเตอร์ให้คนขอคนแรก — คนอื่นชนตัวเดียวกันจะถูกปฏิเสธ
    this.onMessage('battle:request', (client, data) => {
      const id = String(data?.id ?? '')
      const mon = this.state.monsters.get(id)
      if (mon && mon.alive && (mon.lockedBy === '' || mon.lockedBy === client.sessionId)) {
        mon.lockedBy = client.sessionId
        client.send('battle:granted', { id })
      } else {
        client.send('battle:denied', { id })
      }
    })

    this.onMessage('battle:result', (client, data) => {
      const id = String(data?.id ?? '')
      const mon = this.state.monsters.get(id)
      if (!mon || mon.lockedBy !== client.sessionId) return
      mon.lockedBy = ''
      if (data?.won) {
        mon.alive = false // ตายทั้งห้อง — ทุกคนเห็นหายพร้อมกัน
        this.deadAt.set(id, Date.now()) // ตั้งเวลา respawn (10 วิ)
      }
    })

    // มอนสเตอร์เดินสุ่มฝั่ง server — ทุก client เห็นตำแหน่งเดียวกันเป๊ะ
    // ทุก ~1.4 วิ: 40% เดินช้าๆ / 60% หยุด (ตัวที่ถูกล็อกอยู่หยุดนิ่ง)
    this.wanderTick = 0
    this.setSimulationInterval((dt) => {
      this.wanderTick += dt
      const reroll = this.wanderTick >= 1400
      if (reroll) this.wanderTick = 0

      // respawn: มอนสเตอร์ที่ตายครบ 10 วิ → ลบตัวเก่า + เกิดตัวใหม่ (slug เดิม ตำแหน่งสุ่ม)
      const now = Date.now()
      for (const [deadId, ts] of this.deadAt) {
        if (now - ts < 10000) continue
        const old = this.state.monsters.get(deadId)
        this.deadAt.delete(deadId)
        if (old) {
          const fresh = new MonsterState()
          fresh.slug = old.slug
          fresh.x = 64 + Math.random() * (DUNGEON_W - 128)
          fresh.y = 128 + Math.random() * (DUNGEON_H - 192)
          fresh.alive = true
          fresh.lockedBy = ''
          this.state.monsters.delete(deadId)
          this.state.monsters.set(`r${this.respawnSeq++}`, fresh)
        }
      }

      this.state.monsters.forEach((mon, id) => {
        if (!mon.alive || mon.lockedBy !== '') { this.velocities.delete(id); return }
        if (reroll) {
          if (Math.random() < 0.4) {
            const angle = Math.random() * Math.PI * 2
            const spd = 22 + Math.random() * 18
            this.velocities.set(id, { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd })
          } else {
            this.velocities.delete(id)
          }
        }
        const v = this.velocities.get(id)
        if (!v) return
        mon.x = Math.max(64, Math.min(DUNGEON_W - 64, mon.x + (v.vx * dt) / 1000))
        mon.y = Math.max(128, Math.min(DUNGEON_H - 64, mon.y + (v.vy * dt) / 1000))
      })
    }, 100)
  }

  onJoin(client, options = {}) {
    const p = new PlayerState()
    p.x = Math.max(0, Math.min(DUNGEON_W, Number(options.x) || 64))
    p.y = Math.max(0, Math.min(DUNGEON_H, Number(options.y) || DUNGEON_H - 64))
    p.facing = 'down'
    p.moving = false
    p.status = 'idle'
    p.name = String(options.name || 'Hero').slice(0, 18)
    p.classId = ['warrior', 'mage', 'archer', 'guardian'].includes(options.classId) ? options.classId : 'warrior'
    p.gender = options.gender === 'female' ? 'female' : 'male'
    this.state.players.set(client.sessionId, p)
    console.log(`[dungeon:${this.floor}] ${p.name} joined (${this.clients.length}/${this.maxClients})`)
  }

  onLeave(client) {
    // ปลดล็อกมอนสเตอร์ที่คนนี้จองไว้ — เพื่อนสู้ต่อได้ทันที
    this.state.monsters.forEach((mon) => {
      if (mon.lockedBy === client.sessionId) mon.lockedBy = ''
    })
    this.state.players.delete(client.sessionId)
  }
}

// ---------------------------------------------------------------- Co-op battle (Phase 15): SERVER AUTHORITY
// Faithful JS mirror of app/data/coop/authority.ts (the tested spec). The server owns shared-encounter HP,
// clamps + accumulates validated damage (no lone one-shot), and grants each PARTICIPANT its reward exactly
// once (no duplication, reconnect-safe). Inert until a client joins 'coopbattle' — dormant behind the
// client's COOP_ENABLED flag, so offline single-player is untouched. NOTE: pending live-server verification;
// the authority PROPERTIES are proven headless in test/coop.spec.ts.
const COOP_MAX_HIT_FRACTION = 0.5

class CoopEncSchema extends Schema {}
defineTypes(CoopEncSchema, { id: 'string', hp: 'number', maxHp: 'number', alive: 'boolean', phase: 'number' })

class CoopBattleState extends Schema {
  constructor() {
    super()
    this.players = new MapSchema()
    this.encounters = new MapSchema()
  }
}
defineTypes(CoopBattleState, { players: { map: PlayerState }, encounters: { map: CoopEncSchema } })

class CoopBattleRoom extends Room {
  onCreate() {
    this.maxClients = 4
    this.setState(new CoopBattleState())
    this.setPatchRate(50)
    this.seeded = false
    this.participants = new Map() // encId -> Set(sessionId) who dealt damage
    this.claimed = new Set()      // `${encId}::${sessionId}` — reward paid (persists across reconnect)
    this.rewards = new Map()      // encId -> { exp, gold, gems }

    this.onMessage('coop:seed', (client, list) => {
      if (this.seeded || !Array.isArray(list)) return
      this.seeded = true
      for (const e of list.slice(0, 20)) {
        const s = new CoopEncSchema()
        s.id = String(e.id)
        s.maxHp = Math.max(1, Math.round(Number(e.maxHp) || 100))
        s.hp = s.maxHp
        s.alive = true
        s.phase = 1
        this.state.encounters.set(s.id, s)
        this.participants.set(s.id, new Set())
        this.rewards.set(s.id, { exp: Number(e.exp) || 0, gold: Number(e.gold) || 0, gems: Number(e.gems) || 0 })
      }
    })

    // authoritative damage: clamp one hit to 50% of maxHp (no lone one-shot), accumulate, derive phase
    this.onMessage('coop:damage', (client, data) => {
      const enc = this.state.encounters.get(String(data && data.id))
      if (!enc || !enc.alive) return
      const cap = Math.max(1, Math.round(enc.maxHp * COOP_MAX_HIT_FRACTION))
      const applied = Math.max(0, Math.min(cap, Math.round(Number(data.amount) || 0)))
      this.participants.get(enc.id)?.add(client.sessionId)
      enc.hp = Math.max(0, enc.hp - applied)
      if (enc.hp <= 0) enc.alive = false
      const frac = enc.hp / Math.max(1, enc.maxHp)
      enc.phase = frac <= 0.35 ? 3 : frac <= 0.70 ? 2 : 1
    })

    // authoritative reward: only after server-confirmed death, only participants, exactly once each
    this.onMessage('coop:claim', (client, data) => {
      const enc = this.state.encounters.get(String(data && data.id))
      if (!enc || enc.alive) return // can't claim victory while the server says alive
      const parts = this.participants.get(enc.id)
      if (!parts || !parts.has(client.sessionId)) return // non-participant
      const key = `${enc.id}::${client.sessionId}`
      if (this.claimed.has(key)) return // already paid — no duplication / reconnect-safe
      this.claimed.add(key)
      const r = this.rewards.get(enc.id) || { exp: 0, gold: 0, gems: 0 }
      client.send('coop:reward', { id: enc.id, ...r })
    })

    this.onMessage('move', (client, data) => {
      const p = this.state.players.get(client.sessionId)
      if (!p || typeof data !== 'object' || !data) return
      p.x = Number(data.x) || p.x
      p.y = Number(data.y) || p.y
      p.facing = FACINGS.includes(data.facing) ? data.facing : p.facing
      p.moving = !!data.moving
    })
  }

  onJoin(client, options = {}) {
    const p = new PlayerState()
    p.x = Number(options.x) || 64
    p.y = Number(options.y) || 64
    p.facing = 'down'
    p.moving = false
    p.status = 'battle'
    p.name = String(options.name || 'Hero').slice(0, 18)
    p.classId = ['warrior', 'mage', 'archer', 'guardian'].includes(options.classId) ? options.classId : 'warrior'
    p.gender = options.gender === 'female' ? 'female' : 'male'
    this.state.players.set(client.sessionId, p)
  }

  onLeave(client) {
    // reconnect-safe: keep participants + claimed so a returning player can't re-claim; drop only presence
    this.state.players.delete(client.sessionId)
  }
}

const gameServer = new Server()
gameServer.define('town', TownRoom)
gameServer.define('dungeon', DungeonRoom).filterBy(['floor']) // จับกลุ่มห้องตามชั้นอัตโนมัติ
gameServer.define('coopbattle', CoopBattleRoom) // Phase 15 (dormant until client COOP_ENABLED)
gameServer.listen(PORT).then(() => {
  console.log(`SPIRAL'S ECHO server listening on ws://localhost:${PORT}`)
})
