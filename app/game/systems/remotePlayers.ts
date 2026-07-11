// ================================================================================================
// RemotePlayers — เรนเดอร์ผู้เล่นคนอื่นในฉาก (ใช้ร่วม TownScene/TowerScene)
// sprite จาก hero atlas เดียวกับผู้เล่นเรา + ป้ายชื่อ + ไอคอน ⚔ ตอนติดศึก
// delta patch จาก server เก็บเป็น "เป้าหมาย" แล้ว interpolate 25%/เฟรมให้เดินลื่น
// และรับหน้าที่ส่งตำแหน่งเราแบบ throttle (~10 ครั้ง/วิ เฉพาะตอนค่าเปลี่ยน)
// ================================================================================================
import Phaser from 'phaser'
import type { Room } from 'colyseus.js'
import { heroKey, heroIdleFrame, heroAnim, heroSheetSize, HERO_DISPLAY_H } from './textures'
import { sendMove, type NetPlayerSchema } from './net'

interface RemoteEntry {
  sprite: Phaser.GameObjects.Sprite
  label: Phaser.GameObjects.Text
  badge: Phaser.GameObjects.Text
  classId: string
  gender: string
  tx: number
  ty: number
  facing: 'down' | 'left' | 'right' | 'up'
  moving: boolean
  status: string
}

export class RemotePlayers {
  private remotes = new Map<string, RemoteEntry>()
  private lastSent = { x: 0, y: 0, facing: '', moving: false, at: 0 }

  constructor(private scene: Phaser.Scene) {}

  /** ผูก callback สร้าง/อัพเดต/ลบผู้เล่นคนอื่นจาก state ของห้อง */
  bind(room: Room) {
    room.state.players.onAdd((p: NetPlayerSchema, id: string) => {
      if (id === room.sessionId || this.remotes.has(id)) return
      const scale = HERO_DISPLAY_H / heroSheetSize(p.classId, p.gender).fh
      const sprite = this.scene.add.sprite(p.x, p.y, heroKey(p.classId, p.gender), heroIdleFrame(p.classId, p.gender))
        .setOrigin(0.5, 0.92).setScale(scale).setDepth(p.y)
      const label = this.scene.add.text(p.x, p.y - HERO_DISPLAY_H - 4, p.name, {
        fontSize: '9px', fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#cfe6ff', stroke: '#06040a', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(p.y + 0.1)
      const badge = this.scene.add.text(p.x, p.y - HERO_DISPLAY_H - 15, '⚔', { fontSize: '12px' })
        .setOrigin(0.5, 1).setVisible(false).setDepth(p.y + 0.1)
      const entry: RemoteEntry = {
        sprite, label, badge, classId: p.classId, gender: p.gender,
        tx: p.x, ty: p.y, facing: p.facing, moving: p.moving, status: p.status,
      }
      this.remotes.set(id, entry)
      p.onChange(() => {
        entry.tx = p.x
        entry.ty = p.y
        entry.facing = p.facing
        entry.moving = p.moving
        entry.status = p.status
      })
    })
    room.state.players.onRemove((_p: NetPlayerSchema, id: string) => {
      const r = this.remotes.get(id)
      if (!r) return
      r.sprite.destroy(); r.label.destroy(); r.badge.destroy()
      this.remotes.delete(id)
    })
  }

  /** interpolation + อนิเมชันเพื่อน และส่งตำแหน่งเรา — เรียกทุกเฟรมจาก update() ของฉาก */
  update(time: number, local: Phaser.GameObjects.Sprite, facing: string, moving: boolean) {
    for (const r of this.remotes.values()) {
      r.sprite.x += (r.tx - r.sprite.x) * 0.25
      r.sprite.y += (r.ty - r.sprite.y) * 0.25
      r.sprite.setDepth(r.sprite.y)
      const far = Math.abs(r.tx - r.sprite.x) + Math.abs(r.ty - r.sprite.y) > 1.5
      const anim = heroAnim(r.classId, r.gender, r.moving || far ? 'walk' : 'idle', r.facing)
      if (r.sprite.anims.currentAnim?.key !== anim) r.sprite.play(anim)
      r.label.setPosition(r.sprite.x, r.sprite.y - HERO_DISPLAY_H - 4).setDepth(r.sprite.y + 0.1)
      r.badge.setPosition(r.sprite.x, r.sprite.y - HERO_DISPLAY_H - 15).setDepth(r.sprite.y + 0.1)
      r.badge.setVisible(r.status === 'battle')
    }

    const changed = Math.abs(local.x - this.lastSent.x) > 0.5
      || Math.abs(local.y - this.lastSent.y) > 0.5
      || facing !== this.lastSent.facing
      || moving !== this.lastSent.moving
    if (changed && time - this.lastSent.at > 100) {
      sendMove({ x: local.x, y: local.y, facing, moving })
      this.lastSent = { x: local.x, y: local.y, facing, moving, at: time }
    }
  }

  destroy() {
    for (const r of this.remotes.values()) { r.sprite.destroy(); r.label.destroy(); r.badge.destroy() }
    this.remotes.clear()
  }
}
