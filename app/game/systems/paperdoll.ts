// Runtime paper-doll layer (Master Plan Phase 3 Batch B) — วาดอาวุธที่สวมใส่จริงในมือผู้เล่น
// ทุก scene ที่มีตัวละครเดิน ใช้ WeaponOverlay ตัวเดียวกัน: สลับ texture ทันทีเมื่อเปลี่ยนของ,
// จัดตำแหน่ง/ทิศ/หน้า-หลังตาม WEAPON_ANCHORS และ sync depth กับตัวละครทุกเฟรม
import Phaser from 'phaser'
import { assetPath } from './assetBase'
import { getEquipmentVisual, type Facing } from '../../data/equipmentVisuals'

const SCALE = 0.62 // ไอคอน 32px → ~20px พอดีมือ sprite สูง 96 แสดงครึ่งสเกล

export class WeaponOverlay {
  private image?: Phaser.GameObjects.Image
  private currentItemId = ''
  private loadingKey = ''

  constructor(private scene: Phaser.Scene) {}

  /** เรียกทุกเฟรมจาก scene.update — itemId ว่าง = ไม่ถืออาวุธ */
  update(player: { x: number; y: number; depth: number }, facing: Facing, itemId: string | undefined) {
    if (!itemId) { this.hide(); return }
    if (itemId !== this.currentItemId) this.swap(itemId)
    if (!this.image) return
    const visual = getEquipmentVisual(this.currentItemId)
    const anchor = visual?.anchors?.[facing]
    if (!anchor) { this.image.setVisible(false); return }
    this.image
      .setVisible(true)
      .setPosition(player.x + anchor.x, player.y + anchor.y)
      .setFlipX(anchor.flipX)
      .setAngle(anchor.angle)
      .setDepth(player.depth + (anchor.front ? 1 : -1))
  }

  private swap(itemId: string) {
    const visual = getEquipmentVisual(itemId)
    if (!visual || visual.mode !== 'held-icon' || !visual.iconPath) { this.currentItemId = itemId; this.hide(); return }
    this.currentItemId = itemId
    const key = `paperdoll_${visual.iconPath.replace(/[^a-z0-9]+/gi, '_')}`
    if (this.scene.textures.exists(key)) { this.apply(key); return }
    if (this.loadingKey === key) return
    this.loadingKey = key
    this.scene.load.image(key, assetPath(visual.iconPath))
    this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      // ผู้เล่นอาจสลับของอีกครั้งระหว่างโหลด — apply เฉพาะเมื่อยังเป็นชิ้นเดิม
      if (this.loadingKey === key && getEquipmentVisual(this.currentItemId)?.iconPath === visual.iconPath) this.apply(key)
      this.loadingKey = ''
    })
    this.scene.load.start()
  }

  private apply(textureKey: string) {
    if (!this.image) {
      this.image = this.scene.add.image(0, 0, textureKey).setScale(SCALE).setOrigin(0.5, 0.6)
    } else {
      this.image.setTexture(textureKey)
    }
  }

  private hide() { this.image?.setVisible(false) }

  destroy() {
    this.image?.destroy()
    this.image = undefined
  }
}
