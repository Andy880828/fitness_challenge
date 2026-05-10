<script setup lang="ts">
import type { ParticipantProgress } from '~/composables/useGallery'
import Sparkline from '~/components/profile/Sparkline.vue'

interface Props {
  progress: ParticipantProgress
}
const props = defineProps<Props>()

const weightLabel = computed(() => {
  if (props.progress.latestWeight === null) return '尚無量測'
  const init = props.progress.startWeight.toFixed(1)
  const now = props.progress.latestWeight.toFixed(1)
  const delta = props.progress.weightDelta
  const sign = delta !== null && delta < 0 ? '' : '+'
  return delta !== null
    ? `${init} → ${now} kg (${sign}${delta.toFixed(1)})`
    : `${init} kg`
})

const fatLabel = computed(() => {
  const start = props.progress.startFatPct
  const now = props.progress.latestFatPct
  const delta = props.progress.fatDelta
  if (start === null || now === null || delta === null) return null
  const sign = delta < 0 ? '' : '+'
  return `${start.toFixed(1)} → ${now.toFixed(1)}% (${sign}${delta.toFixed(1)})`
})

const isLoss = computed(() => (props.progress.weightDelta ?? 0) < 0)
</script>

<template>
  <NuxtLink
    :to="`/profile/${progress.id}`"
    class="card p-4 block hover:border-[var(--accent)] transition-colors"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span
          class="w-2 h-2 rounded-full inline-block"
          :class="progress.gender === 'M' ? 'bg-[var(--accent)]' : 'bg-[var(--photo)]'"
        />
        <span class="display-font text-xl">{{ progress.name }}</span>
      </div>
      <span class="mono text-[0.65rem] text-[var(--text-dim)] uppercase">
        {{ progress.gender === 'M' ? 'MALE' : 'FEMALE' }}
      </span>
    </div>

    <div class="space-y-1 mb-3 text-sm">
      <div class="flex justify-between">
        <span class="text-[var(--text-dim)] mono text-[0.7rem]">體重</span>
        <span :class="isLoss ? 'text-[var(--accent)]' : ''">{{ weightLabel }}</span>
      </div>
      <div v-if="fatLabel" class="flex justify-between">
        <span class="text-[var(--text-dim)] mono text-[0.7rem]">體脂</span>
        <span>{{ fatLabel }}</span>
      </div>
    </div>

    <div v-if="progress.weightTrend.length >= 2" class="mb-3">
      <Sparkline
        :values="progress.weightTrend"
        :stroke="isLoss ? 'var(--accent)' : 'var(--accent-2)'"
      />
    </div>

    <div class="grid grid-cols-3 gap-2 mono text-[0.65rem] text-[var(--text-dim)] uppercase">
      <div class="text-center">
        <div class="text-[var(--text)] text-base font-bold">{{ progress.workoutDays }}</div>
        <div>運動</div>
      </div>
      <div class="text-center">
        <div class="text-[var(--text)] text-base font-bold">{{ progress.dietDays }}</div>
        <div>飲食</div>
      </div>
      <div class="text-center">
        <div class="text-[var(--text)] text-base font-bold">{{ progress.photoDays }}</div>
        <div>拍照</div>
      </div>
    </div>
  </NuxtLink>
</template>
