<template>
  <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="town-guide-title">
    <div class="pixel-window anime-window w-full max-w-2xl">
      <div class="pixel-titlebar">
        <div><p class="ornate-kicker text-[9px]">EXPLORER’S DIRECTORY</p><h2 id="town-guide-title" class="gold-text font-display text-lg font-bold">Aethergate Town Guide</h2></div>
        <button class="icon-btn-close" type="button" aria-label="ปิดคู่มือเมือง" @click="$emit('close')">×</button>
      </div>
      <div class="pixel-window-body p-4">
        <p class="directory-rule">หน้าต่างนี้ใช้ดูเส้นทางเท่านั้น · การซื้อของ รับเควส คราฟต์ รักษา และเดินทาง ต้องเข้าอาคารแล้วคุยกับ NPC ผู้รับผิดชอบ</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="place in places" :key="place.name" class="place-card">
            <img :src="assetPath(place.icon)" alt="">
            <div><strong>{{ place.name }}</strong><small>{{ place.npc }} · {{ place.direction }}</small><p>{{ place.service }}</p></div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ (event: 'close'): void }>()
const config = useRuntimeConfig()
const places = [
  { name: 'Adventurers Guild', npc: 'Mara · Rook · Lyra', direction: 'มุมซ้ายบน', service: 'เควส ภารกิจล่า Daily Rift และบันไดสู่ Academy 2F', icon: 'skill-icons/swords.png' },
  { name: 'Tower Gatehouse', npc: 'Kael', direction: 'กลางด้านบน', service: 'ออกสำรวจ World และเข้าหอคอยจัดอันดับ', icon: 'skill-icons/tower_shield.png' },
  { name: 'Brightleaf Hospital', npc: 'Sena', direction: 'มุมขวาบน', service: 'ฟื้นฟู HP และ MP', icon: 'skill-icons/ward.png' },
  { name: 'Blacksmith & Armory', npc: 'Borin · Toma', direction: 'ฝั่งซ้าย', service: 'ซื้ออุปกรณ์และคราฟต์ไอเทม', icon: 'skill-icons/greatsword.png' },
  { name: 'General Goods', npc: 'Wren', direction: 'ฝั่งขวา', service: 'ซื้อยาและเสบียง', icon: 'item-icons/potion_s.png' },
  { name: 'Public Library', npc: 'Mira', direction: 'เหนือจัตุรัส', service: 'คำแนะนำการเรียนและข้อมูล O-NET', icon: 'skill-icons/book.png' },
  { name: 'Tailor & Wardrobe', npc: 'Vela', direction: 'ตะวันออกเฉียงใต้', service: 'ตรวจชุด Paper-doll และ Equipment Set', icon: 'item-icons/armor_t1.png' },
  { name: 'Hearthsong Inn', npc: 'Bram', direction: 'ตะวันตกเฉียงใต้', service: 'พัก ฟื้นพลัง และฟังข่าวลือ', icon: 'skill-icons/orb.png' },
  { name: 'Aether Vault', npc: 'Oren', direction: 'ฝั่งขวาล่าง', service: 'ข้อมูลคลังเก็บของ', icon: 'item-icons/trk_ring.png' },
]
function assetPath(path: string) { const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`; return `${base}${path.replace(/^\/+/, '')}` }
</script>

<style scoped>
.directory-rule { padding: 10px 12px; border: 1px solid #a47e3d; border-radius: 10px 3px 10px 3px; color: #e2d2ac; background: linear-gradient(100deg, #4f3c2055, #111522); font-size: 11px; line-height: 1.55; }
.place-card { display: flex; gap: 9px; min-height: 88px; padding: 9px; border: 1px solid #665331; border-radius: 9px 3px 9px 3px; background: #0b0e18dd; }.place-card img { width: 34px; height: 34px; object-fit: contain; image-rendering: pixelated; }.place-card strong, .place-card small, .place-card p { display: block; }.place-card strong { color: #efd38a; font: 800 11px Cinzel, Georgia, serif; }.place-card small { color: #a99c7d; font-size: 9px; }.place-card p { margin-top: 4px; color: #c7bfac; font-size: 9px; line-height: 1.4; }
</style>

