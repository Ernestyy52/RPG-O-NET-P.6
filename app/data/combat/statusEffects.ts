// ================================================================================================
// Status effect catalog (Master Plan Phase 4) — หน่วยกลางของระบบคอมโบ data-driven
// คอมโบเกิดจาก "สกิลหนึ่ง apply สถานะ → อีกสกิล consume สถานะ" ไม่มี hardcode คู่คอมโบ
// ทุกตัวเลขอยู่ในไฟล์นี้ + skillDefs.ts เท่านั้น engine เป็นผู้ตีความ (loadoutEngine.ts)
// ================================================================================================

export type StatusId = 'burn' | 'bleed' | 'chill' | 'expose' | 'regen' | 'shock'

export interface StatusDefinition {
  id: StatusId
  name: string
  /** สถานะติดที่ใคร */
  side: 'enemy' | 'self'
  /** dot: ดาเมจต่อจังหวะโจมตีของมอนสเตอร์ (สัดส่วนของ heroDamage base) */
  dotMultPerTick?: boolean
  /** ยืดช่วงโจมตีของมอนสเตอร์ (>1 = ช้าลง) */
  slowMult?: number
  /** ดาเมจครั้งถัดไปของฮีโร่คูณด้วย magnitude แล้วสถานะหมดไป (spend-on-hit) */
  amplifyNextHit?: boolean
  /** ฟื้น HP ต่อจังหวะ (magnitude = HP ต่อ tick) */
  hotPerTick?: boolean
  /** มอนสเตอร์ข้ามการโจมตีขณะมีสถานะ */
  skipAttacks?: boolean
  /** ไอคอน/รูปทรงสำหรับ UI (color-blind cue = รูปทรง ไม่ใช่สีเดียว) */
  glyph: string
}

export const STATUS_EFFECTS: Record<StatusId, StatusDefinition> = {
  burn: { id: 'burn', name: 'Burning', side: 'enemy', dotMultPerTick: true, glyph: 'fire' },
  bleed: { id: 'bleed', name: 'Bleeding', side: 'enemy', dotMultPerTick: true, glyph: 'cleave' },
  chill: { id: 'chill', name: 'Chilled', side: 'enemy', slowMult: 1.55, glyph: 'ice' },
  expose: { id: 'expose', name: 'Exposed', side: 'enemy', amplifyNextHit: true, glyph: 'arrow' },
  regen: { id: 'regen', name: 'Regenerating', side: 'self', hotPerTick: true, glyph: 'ward' },
  shock: { id: 'shock', name: 'Shocked', side: 'enemy', skipAttacks: true, glyph: 'lightning' },
}

export interface ActiveStatus {
  id: StatusId
  remainingMs: number
  magnitude: number
}
