<template>
  <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="academy-title">
    <div class="pixel-window anime-window academy-window w-full max-w-3xl">
      <div class="pixel-titlebar">
        <div>
          <p class="ornate-kicker text-[9px]">GUILD ACADEMY · {{ ACADEMY_KNOWLEDGE_YEARS }}</p>
          <h2 id="academy-title" class="gold-text font-display text-lg font-bold">{{ tutor.roomEn }} · {{ tutor.roomTh }}</h2>
          <p class="text-[11px] text-[#cdbb91]">{{ tutor.name }} · {{ tutor.title }}</p>
        </div>
        <button class="icon-btn-close" type="button" aria-label="ปิดห้องเรียน" @click="$emit('close')">×</button>
      </div>

      <div class="pixel-window-body grid gap-3 p-4 md:grid-cols-[240px_1fr]">
        <aside class="academy-sidebar">
          <div class="coverage-card">
            <span>KNOWLEDGE COVERAGE</span>
            <strong>{{ completedInRoom }}/{{ lessons.length }}</strong>
            <small>สังเคราะห์จาก {{ ACADEMY_PATTERN_COUNT }} ข้อ · ข้อสอบ 11 ปี</small>
          </div>
          <p class="my-3 text-[11px] leading-relaxed text-[#cdbb91]">
            เนื้อหาเรียบเรียงจากแพตเทิร์นใน <code>knowledge/</code> โดยไม่คัดลอกข้อสอบจริง
            เลือกเรียนทีละบทกับอาจารย์ประจำห้อง
          </p>
          <div class="space-y-2">
            <button
              v-for="lesson in lessons"
              :key="lesson.id"
              class="lesson-select"
              :class="{ active: selected?.id === lesson.id, done: isDone(lesson.id) }"
              type="button"
              @click="selected = lesson"
            >
              <span>{{ isDone(lesson.id) ? '✓' : '◇' }}</span>
              <span><b>{{ lesson.title }}</b><small>{{ lesson.titleTh }} · {{ lesson.cefr }}</small></span>
            </button>
          </div>
        </aside>

        <section v-if="selected" class="lesson-scroll">
          <div class="lesson-heading">
            <div>
              <p>{{ selected.category.toUpperCase() }} · {{ selected.cefr }}</p>
              <h3>{{ selected.title }}</h3>
              <small>{{ selected.titleTh }}</small>
            </div>
            <span class="mastery-seal" :class="{ done: isDone(selected.id) }">{{ isDone(selected.id) ? 'MASTERED' : 'STUDY' }}</span>
          </div>
          <p class="lesson-summary">{{ selected.summary }}</p>

          <div class="lesson-section">
            <h4>สาระสำคัญ</h4>
            <ul>
              <li v-for="(point, index) in selected.points" :key="index">{{ point }}</li>
            </ul>
          </div>

          <div class="lesson-section">
            <h4>ตัวอย่าง</h4>
            <div v-for="(example, index) in selected.examples" :key="index" class="example-card">
              <b>{{ example.en }}</b>
              <span>{{ example.th }}</span>
            </div>
          </div>

          <div class="exam-tip"><b>Exam Sense</b><span>{{ selected.tip }}</span></div>
          <button class="btn-primary mt-4 w-full" type="button" :disabled="isDone(selected.id)" @click="completeLesson">
            {{ isDone(selected.id) ? 'เรียนบทนี้แล้ว ✓' : 'สรุปบทเรียนและบันทึกความชำนาญ · +18 EXP · +6g' }}
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ACADEMY_KNOWLEDGE_YEARS, ACADEMY_PATTERN_COUNT, academyLessons, academyTutor, ACADEMY_TUTORS } from '~/data/academy'
import type { StudyCategory, StudyLesson } from '~/data/study'
import { gameEvents } from '~/game/systems/eventBus'
import { usePlayerStore } from '~/stores/player'

const props = defineProps<{ open: boolean; category: StudyCategory; tutorId: string }>()
const emit = defineEmits<{ (event: 'close'): void; (event: 'completed'): void }>()
const player = usePlayerStore()
const tutor = computed(() => academyTutor(props.tutorId) ?? ACADEMY_TUTORS.find((entry) => entry.category === props.category)!)
const lessons = computed(() => academyLessons(props.category))
const selected = ref<StudyLesson | null>(null)
const completedInRoom = computed(() => lessons.value.filter((lesson) => isDone(lesson.id)).length)

function isDone(id: string) { return player.academyLessonsCompleted.includes(id) }

function completeLesson() {
  if (!selected.value || !player.completeAcademyLesson(selected.value.id)) return
  gameEvents.emit('audio:sfx', { key: 'rare_drop' })
  gameEvents.emit('notice', { text: `📚 เรียน ${selected.value.title} สำเร็จ · Academy Mastery เพิ่มขึ้น` })
  emit('completed')
}

watch([() => props.open, lessons], ([isOpen]) => {
  if (isOpen) selected.value = lessons.value.find((lesson) => !isDone(lesson.id)) ?? lessons.value[0] ?? null
}, { immediate: true })
</script>

<style scoped>
.academy-window { max-height: min(92vh, 780px); overflow: hidden; }
.academy-sidebar { min-height: 0; max-height: 68vh; overflow: auto; padding-right: 4px; }
.coverage-card { padding: 12px; border: 1px solid #a98443; border-radius: 12px 4px 12px 4px; background: radial-gradient(circle at 20% 0, #65552f66, transparent 55%), #111323; box-shadow: inset 0 0 20px #0008; }
.coverage-card span, .coverage-card small { display: block; color: #bcae8b; font-size: 9px; letter-spacing: .12em; }
.coverage-card strong { display: block; margin: 3px 0; color: #f4d486; font: 800 26px/1 Cinzel, Georgia, serif; }
.lesson-select { display: flex; width: 100%; align-items: center; gap: 8px; padding: 8px; border: 1px solid #665537; border-radius: 8px 3px 8px 3px; color: #d8cdb4; background: #0b0d17cc; text-align: left; }
.lesson-select:hover, .lesson-select.active { border-color: #dfbd70; background: linear-gradient(100deg, #463823aa, #141625); }
.lesson-select.done > span:first-child { color: #73e6a7; }.lesson-select b, .lesson-select small { display: block; }.lesson-select b { font-size: 11px; }.lesson-select small { color: #9e9278; font-size: 9px; }
.lesson-scroll { min-height: 0; max-height: 68vh; overflow: auto; padding: 14px; border: 1px solid #735d35; border-radius: 14px 4px 14px 4px; background: linear-gradient(160deg, #2e2741f0, #111421f8); box-shadow: inset 0 0 32px #0008; }
.lesson-heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; border-bottom: 1px solid #75603e88; padding-bottom: 10px; }.lesson-heading p { color: #b69c66; font-size: 9px; letter-spacing: .15em; }.lesson-heading h3 { color: #f2d48e; font: 800 20px Cinzel, Georgia, serif; }.lesson-heading small { color: #c0b394; }
.mastery-seal { padding: 4px 8px; border: 1px solid #b39052; border-radius: 999px; color: #d8be7a; font-size: 9px; font-weight: 900; }.mastery-seal.done { border-color: #67c98d; color: #7ee5a7; }
.lesson-summary { margin: 12px 0; padding: 10px; border-left: 3px solid #cda95f; background: #0004; color: #e0d5bc; font-size: 12px; line-height: 1.65; }
.lesson-section { margin-top: 12px; }.lesson-section h4 { margin-bottom: 6px; color: #d8ba75; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: .1em; }.lesson-section ul { list-style: disc; padding-left: 20px; color: #d8d0bf; font-size: 12px; line-height: 1.7; }
.example-card { margin-top: 6px; padding: 8px 10px; border: 1px solid #67583d88; border-radius: 7px; background: #090b13aa; }.example-card b, .example-card span { display: block; }.example-card b { color: #f1dfae; font-size: 12px; }.example-card span { margin-top: 2px; color: #a99e89; font-size: 10px; }
.exam-tip { display: grid; gap: 3px; margin-top: 12px; padding: 10px; border: 1px solid #a76f4b88; border-radius: 8px; background: #4c291d55; color: #e7ccb2; font-size: 11px; }.exam-tip b { color: #ffbf78; font-family: Cinzel, Georgia, serif; }
@media (max-width: 767px) { .academy-window { overflow: auto; }.academy-sidebar, .lesson-scroll { max-height: none; }.academy-sidebar { padding-right: 0; } }
</style>

