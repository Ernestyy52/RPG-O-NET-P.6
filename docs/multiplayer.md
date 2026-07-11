# Multiplayer — สถาปัตยกรรมและแผนพัฒนา

สถานะปัจจุบัน: **ห้องเมือง + ห้องดันเจี้ยนรายชั้น + instanced battle ใช้งานได้จริง**
- เมือง: ผู้เล่นเดินเห็นกัน real-time พร้อมชื่อเหนือหัว + ไอคอน ⚔ เมื่อเพื่อนติดศึก
- ดันเจี้ยน: ห้องแยกตามชั้น (`filterBy floor`), มอนสเตอร์เดินจาก **server** ทุกคนเห็นตำแหน่งเดียวกัน
  (client คนแรก seed รายการมอนสเตอร์ → server เป็นเจ้าของต่อ), ผู้เล่นคนอื่นโผล่ในชั้นด้วย
- instanced battle: ชนมอนสเตอร์ = ขอสิทธิ์จาก server ก่อน — ตัวที่เพื่อนจองแสดง ⚔ และชนไม่ติด,
  ชนะแล้วมอนสเตอร์ตาย **ทั้งห้องพร้อมกัน**, แพ้/หนี/หลุดออกกลางคัน = ปลดล็อกให้เพื่อนสู้ต่อ
- เล่นออฟไลน์ได้เสมอถ้าไม่มี server (ทุกอย่าง fallback เป็นระบบ local เดิม)

## รันเซิร์ฟเวอร์

```bash
# local dev — client ตอน dev จะต่อ ws://localhost:2567 ให้อัตโนมัติ
cd server && npm install && npm start
```

Production: deploy โฟลเดอร์ `server/` ขึ้น Render / Fly.io / Railway (ฟรีเทียร์พอสำหรับห้องละ 16 คน)
แล้วตั้ง env ตอน build เว็บ: `NUXT_PUBLIC_COLYSEUS_URL=wss://<your-server>` — ไม่ตั้ง = ออฟไลน์ล้วน

## โครงสร้าง

```
client (GitHub Pages, static)          server (Colyseus 0.15, Node)
┌──────────────────────────┐           ┌─────────────────────────────┐
│ TownScene                │  join     │ TownRoom (max 16)           │
│  - setupMultiplayer()    │──────────▶│  state.players: MapSchema   │
│  - updateMultiplayer()   │  move 10Hz│  - clamp bounds, rate limit │
│    interpolation 25%/f   │◀──────────│  patch broadcast 20Hz       │
│ systems/net.ts           │  patches  │                             │
└──────────────────────────┘           └─────────────────────────────┘
```

- **client → server**: `move {x,y,facing,moving}` throttle ~10 ครั้ง/วิ เฉพาะตอนค่าเปลี่ยน, `status idle|battle`
- **server → client**: delta patch อัตโนมัติของ Colyseus schema (20Hz) — client เก็บเป็นเป้าหมายแล้ว lerp 25%/เฟรม
- เวอร์ชันต้องตรงกัน: `colyseus@0.15.x` (server) ↔ `colyseus.js@0.15.x` (client) — โปรโตคอล 0.15/0.16 คุยกันไม่ได้

## มาตรฐานขนาด (ล็อกแล้วในโค้ด — สำคัญต่อ netcode)

- `HERO_DISPLAY_H = 48` px ทุกฉาก (textures.ts)
- hitbox ผู้เล่น ~18×12 px ที่เท้า เท่ากันทุกคลาส (`applyStandardHeroBody`) — server ใช้เลขเดียวกันได้เลย
- ผู้เล่นทุกคลาสอยู่ใน `hero-atlas.png` เดียว (สร้างด้วย `scripts/sprite-crop/build-hero-atlas.cjs`)
  → ผู้เล่นทั้งฉาก render batch เดียว; เดิน 4 สเต็ป [step, stand, step2, stand]
- โลกเมือง 1199×608 px — server clamp ตามเลขนี้ (`server/index.js` ต้องแก้ตามถ้าเปลี่ยนแมพ)

## ขั้นถัดไป (เรียงลำดับ)

1. ~~Dungeon rooms~~ ✅ เสร็จแล้ว — `DungeonRoom` ใน server/index.js + `setupMultiplayer` ใน TowerScene
2. ~~Instanced battle (ล็อกกันแย่ง)~~ ✅ เสร็จแล้ว — `battle:request/granted/denied/result`
   - ต่อยอดความสนุก: **co-op battle** ห้องละ 2-4 คนตอบคำถามชุดเดียวกัน แข่งความเร็ว/ช่วยกันตี
     (server สุ่มคำถาม id เดียวกันให้ทุกคนใน party — เหมาะกับห้องเรียนมาก)
3. **Authoritative movement** — ย้าย movement ไป server (client ส่ง input ไม่ใช่ตำแหน่ง)
   + client prediction เมื่อผู้เล่นเยอะหรือต้องกันโกงจริงจัง
4. **Persistence** — บัญชีผู้เล่นย้ายจาก localStorage/Sheets ไป database ฝั่ง server
   (SQLite/Postgres) — Sheets เหลือหน้าที่ leaderboard อย่างเดียว
5. **Interest management** — ถ้าห้องใหญ่ขึ้น (>30 คน) ส่งเฉพาะผู้เล่นในรัศมีกล้อง
6. **Chat / emote** — `room.onMessage('chat')` + ฟองข้อความเหนือหัว (โครงพร้อมแล้ว)

## ข้อจำกัดของ prototype ปัจจุบัน (ตั้งใจ ยังไม่ต้องแก้)

- server เชื่อตำแหน่งจาก client (มี clamp + rate limit) — พอสำหรับเล่นในห้องเรียน/กลุ่มเพื่อน
- ห้องเมืองห้องเดียว (`town`) — ทุกชั้นเมืองแชร์ห้องกัน (ผู้เล่นต่างชั้นก็เห็นกันในเมือง)
- ยังไม่มี chat — เพิ่มได้ง่ายด้วย `room.onMessage('chat')` + broadcast
