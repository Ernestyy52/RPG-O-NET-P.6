<template>
  <div class="min-h-screen bg-[#0d0b14] p-4 text-[#e8e0cf] sm:p-8">
    <div class="mx-auto max-w-3xl">
      <!-- Flag off ⇒ หน้านี้ไม่เผยข้อมูลใด ๆ (dormant per Phase 16) -->
      <div v-if="!TEACHER_ENABLED" class="pixel-window">
        <div class="pixel-titlebar"><h1 class="gold-text text-lg font-bold">Teacher Dashboard</h1></div>
        <div class="pixel-window-body p-6 text-sm">
          <p>แดชบอร์ดครูยังไม่เปิดใช้งานในรุ่นนี้ (TEACHER_ENABLED = false)</p>
          <NuxtLink to="/" class="btn-primary mt-4 inline-block text-xs">กลับสู่เกม</NuxtLink>
        </div>
      </div>

      <template v-else>
        <div class="pixel-window">
          <div class="pixel-titlebar gap-3">
            <h1 class="gold-text text-lg font-bold">📊 Teacher Dashboard — O-NET English</h1>
            <NuxtLink to="/" class="btn-secondary text-xs">กลับสู่เกม</NuxtLink>
          </div>
          <div class="pixel-window-body p-4">
            <p class="mb-3 text-xs opacity-75">
              รายงานสร้างจากข้อมูลการเรียนรู้ (mastery) บนอุปกรณ์นี้เท่านั้น — ไม่มีเฉลยข้อสอบ
              และไม่มีข้อมูลส่วนตัว/เซฟเกมของผู้เล่นปะปน (Phase-16 data separation)
            </p>
            <label class="mb-4 block text-sm">
              ชื่อที่ใช้ในรายงาน (กำหนดโดยครู):
              <input v-model="label" type="text" class="ml-2 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm" maxlength="40">
            </label>

            <div v-if="report.totalAnswered === 0" class="glass-panel p-4 text-sm">
              ยังไม่มีข้อมูลการตอบคำถาม — ให้นักเรียนเล่นเกมสักพัก (ตอบคำถามในการต่อสู้หรือ Knowledge Break)
              แล้วกลับมาดูรายงานที่นี่
            </div>

            <template v-else>
              <!-- ภาพรวม -->
              <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div class="glass-panel p-3 text-center">
                  <div class="text-2xl font-bold">{{ report.totalAnswered }}</div>
                  <div class="text-xs opacity-75">ข้อที่ตอบทั้งหมด</div>
                </div>
                <div class="glass-panel p-3 text-center">
                  <div class="text-2xl font-bold" :class="accuracyColor">{{ pct(report.accuracy) }}%</div>
                  <div class="text-xs opacity-75">ความแม่นยำ</div>
                </div>
                <div class="glass-panel p-3 text-center">
                  <div class="text-2xl font-bold">{{ pct(report.coverage) }}%</div>
                  <div class="text-xs opacity-75">ครอบคลุมหลักสูตร</div>
                </div>
                <div class="glass-panel p-3 text-center">
                  <div class="text-2xl font-bold">{{ report.dueForReview }}</div>
                  <div class="text-xs opacity-75">หัวข้อถึงรอบทบทวน</div>
                </div>
              </div>

              <!-- รายหมวด -->
              <h2 class="gold-text mb-2 text-sm font-bold">ผลรายหมวด (O-NET domains)</h2>
              <div class="glass-panel mb-4 overflow-x-auto p-3">
                <table class="w-full text-left text-sm">
                  <thead><tr class="text-xs opacity-75"><th class="pb-1">หมวด</th><th class="pb-1">ตอบ</th><th class="pb-1">ถูก</th><th class="pb-1">ความแม่นยำ</th></tr></thead>
                  <tbody>
                    <tr v-for="d in report.byDomain" :key="d.domain">
                      <td class="py-1 capitalize">{{ d.domain }}</td>
                      <td>{{ d.attempts }}</td>
                      <td>{{ d.correct }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="h-2 w-24 overflow-hidden rounded bg-black/40"><div class="h-full bg-emerald-500" :style="{ width: `${pct(d.accuracy)}%` }" /></div>
                          <span class="text-xs">{{ pct(d.accuracy) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- จุดอ่อนที่ควรสอนเสริม -->
              <h2 class="gold-text mb-2 text-sm font-bold">หัวข้อที่อ่อนที่สุด (ควรสอนเสริมก่อน)</h2>
              <div class="glass-panel mb-4 p-3">
                <ul class="space-y-1 text-sm">
                  <li v-for="w in report.weakest" :key="w.subskillId" class="flex items-center justify-between gap-2">
                    <span>{{ w.name }} <span class="text-xs opacity-60">({{ w.domain }})</span></span>
                    <span class="text-xs opacity-80">mastery {{ pct(w.mastery) }}% · {{ w.correct }}/{{ w.attempts }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="report.commonMisconceptions.length" class="mb-4">
                <h2 class="gold-text mb-2 text-sm font-bold">ความเข้าใจคลาดเคลื่อนที่พบบ่อย</h2>
                <div class="glass-panel p-3 text-sm">
                  <ul class="space-y-1">
                    <li v-for="m in report.commonMisconceptions" :key="m.tag">{{ m.tag }} <span class="text-xs opacity-60">×{{ m.count }}</span></li>
                  </ul>
                </div>
              </div>

              <!-- Export -->
              <div class="flex flex-wrap gap-2">
                <button class="btn-primary text-xs" @click="downloadCsv">⬇ ดาวน์โหลด CSV (gradebook)</button>
                <button class="btn-secondary text-xs" @click="copyJson">{{ copied ? '✓ คัดลอกแล้ว' : 'คัดลอก JSON' }}</button>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// ================================================================================================
// Teacher dashboard (Phase 16 flip — Class C item closed). Reads ONLY the learning store's mastery
// through the pure, tested teacher reports domain. No answer keys, no player-save/personal data.
// ================================================================================================
import { computed, ref } from 'vue'
import { TEACHER_ENABLED, buildLearnerReport, learnerReportToCsv } from '~/data/teacher'
import { useLearningStore } from '~/stores/learning'

const learning = useLearningStore()
const label = ref('Learner')
const copied = ref(false)

const report = computed(() => buildLearnerReport(label.value || 'Learner', learning.mastery))
const pct = (v: number) => Math.round(v * 100)
const accuracyColor = computed(() =>
  report.value.accuracy >= 0.75 ? 'text-emerald-300' : report.value.accuracy >= 0.5 ? 'text-amber-300' : 'text-red-300')

function downloadCsv() {
  const csv = learnerReportToCsv(report.value)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }) // BOM ให้ Excel อ่านไทย/ยูนิโค้ดถูก
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `onet-progress-${(label.value || 'learner').replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyJson() {
  await navigator.clipboard.writeText(JSON.stringify(report.value, null, 2))
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>
