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
      if (data?.won) mon.alive = false // ตายทั้งห้อง — ทุกคนเห็นหายพร้อมกัน
    })

    // มอนสเตอร์เดินสุ่มฝั่ง server — ทุก client เห็นตำแหน่งเดียวกันเป๊ะ
    // ทุก ~1.4 วิ: 40% เดินช้าๆ / 60% หยุด (ตัวที่ถูกล็อกอยู่หยุดนิ่ง)
    this.wanderTick = 0
    this.setSimulationInterval((dt) => {
      this.wanderTick += dt
      const reroll = this.wanderTick >= 1400
      if (reroll) this.wanderTick = 0
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

const gameServer = new Server()
gameServer.define('town', TownRoom)
gameServer.define('dungeon', DungeonRoom).filterBy(['floor']) // จับกลุ่มห้องตามชั้นอัตโนมัติ
gameServer.listen(PORT).then(() => {
  console.log(`SPIRAL'S ECHO server listening on ws://localhost:${PORT}`)
})
