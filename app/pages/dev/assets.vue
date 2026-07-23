<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 p-4 font-mono text-sm">
    <h1 class="text-xl mb-1">Dev Asset Gallery</h1>
    <p class="text-slate-400 mb-3">
      registry: {{ registry.generated }} — {{ registry.totals.files }} files,
      {{ (registry.totals.bytes / 1048576).toFixed(1) }} MB
      (used {{ registry.totals.used }} / unused {{ registry.totals.unused }} /
      dev-only {{ registry.totals.devOnly }}) — รัน `node scripts/asset-truth.cjs` เพื่ออัปเดต
    </p>

    <div class="flex gap-2 mb-4 flex-wrap">
      <select v-model="dirFilter" class="bg-slate-800 border border-slate-600 rounded px-2 py-1">
        <option value="">ทุกโฟลเดอร์</option>
        <option v-for="d in dirs" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="statusFilter" class="bg-slate-800 border border-slate-600 rounded px-2 py-1">
        <option value="">ทุกสถานะ</option>
        <option v-for="s in ['used', 'unused', 'duplicate', 'dev-only']" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="search" placeholder="ค้นหา path..."
        class="bg-slate-800 border border-slate-600 rounded px-2 py-1 flex-1 min-w-40" />
      <label class="flex items-center gap-1"><input type="checkbox" v-model="pixelated" /> nearest</label>
    </div>

    <div v-if="registry.errors.length" class="mb-3 p-2 bg-red-900/50 border border-red-500 rounded">
      <div v-for="e in registry.errors" :key="e">FAIL {{ e }}</div>
    </div>

    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
      <div v-for="a in filtered" :key="a.id"
        class="border rounded p-2 bg-slate-800"
        :class="a.status === 'unused' ? 'border-amber-500' : a.status === 'duplicate' ? 'border-red-400' : 'border-slate-600'">
        <div class="h-24 flex items-center justify-center bg-[conic-gradient(#334155_90deg,#1e293b_90deg_180deg,#334155_180deg_270deg,#1e293b_270deg)] bg-[length:16px_16px] rounded overflow-hidden">
          <img v-if="a.type === 'image'" :src="assetPath(a.path)" loading="lazy"
            class="max-h-24 max-w-full object-contain"
            :style="pixelated ? 'image-rendering: pixelated' : ''"
            @error="broken.add(a.path)" />
          <audio v-else-if="a.type === 'audio'" :src="assetPath(a.path)" controls preload="none" class="w-full" />
          <span v-else class="text-slate-500">{{ a.type }}</span>
        </div>
        <div class="mt-1 break-all text-xs" :title="a.path">{{ a.path }}</div>
        <div class="text-xs text-slate-400">
          {{ (a.bytes / 1024).toFixed(1) }} KB
          <template v-if="a.dimensions"> · {{ a.dimensions[0] }}×{{ a.dimensions[1] }}</template>
          · <span :class="a.status === 'used' ? 'text-emerald-400' : 'text-amber-400'">{{ a.status }}</span>
        </div>
        <div class="text-xs text-slate-500 truncate" :title="a.consumers.join('\n')">
          {{ a.consumers.length }} consumer(s) · {{ a.license }}
        </div>
        <div v-if="broken.has(a.path)" class="text-red-400 text-xs">โหลดไม่ได้ (missing/misaligned)</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dev-only (ถูกตัดออกจาก production ผ่าน pages:extend hook ใน nuxt.config.ts)
import { ref, computed, reactive } from 'vue'
import registryData from '../../../docs/ASSET_REGISTRY.json'
import { assetPath, setAssetBase } from '~/game/systems/assetBase'

const config = useRuntimeConfig()
setAssetBase(config.app.baseURL)

type AssetRecord = {
  id: string; path: string; type: string; bytes: number
  dimensions?: [number, number]; hash: string; consumers: string[]
  source: string; license: string; status: string
}
const registry = registryData as unknown as {
  generated: string
  totals: { files: number; bytes: number; used: number; unused: number; devOnly: number; duplicate: number }
  errors: string[]; warnings: string[]; assets: AssetRecord[]
}

const dirFilter = ref('')
const statusFilter = ref('')
const search = ref('')
const pixelated = ref(true)
const broken = reactive(new Set<string>())

const dirs = computed(() => [...new Set(registry.assets.map((a) => a.path.split('/')[0]))].sort())
const filtered = computed(() => registry.assets.filter((a) =>
  (!dirFilter.value || a.path.startsWith(dirFilter.value + '/')) &&
  (!statusFilter.value || a.status === statusFilter.value) &&
  (!search.value || a.path.toLowerCase().includes(search.value.toLowerCase())),
))
</script>
