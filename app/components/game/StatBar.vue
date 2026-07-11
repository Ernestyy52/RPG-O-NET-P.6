<template>
  <div class="stat-bar" :class="`stat-bar-${variant}`">
    <div class="stat-bar-track">
      <div class="stat-bar-fill" :class="{ 'stat-bar-low': variant === 'hp' && pct <= 25 }" :style="{ width: `${pct}%` }" />
      <div class="stat-bar-text">{{ label }} {{ value }}/{{ max }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; max: number; variant: 'hp' | 'mp' | 'exp'; label: string }>()
const pct = computed(() => Math.max(0, Math.min(100, Math.round((props.value / Math.max(1, props.max)) * 100))))
</script>
