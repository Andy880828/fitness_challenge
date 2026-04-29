<script setup lang="ts">
import type { ScoreBreakdown } from '#shared/types/score'

interface Props {
  rank: number
  participantId: string
  name: string
  gender: 'M' | 'F'
  score: ScoreBreakdown
}
const props = defineProps<Props>()

const scoreTarget = computed(() => props.score.total)
const scoreDisplay = useCountUp(scoreTarget, { duration: 800, decimals: 1 })

const medalColor = (rank: number): string => {
  if (rank === 1) return 'text-[var(--accent)]'
  if (rank === 2) return 'text-[var(--text)]'
  if (rank === 3) return 'text-[var(--accent-2)]'
  return 'text-[var(--text-dim)]'
}
</script>

<template>
  <NuxtLink
    :to="`/profile/${participantId}`"
    class="card card-hover p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
  >
    <div class="display-font text-2xl sm:text-3xl w-8 sm:w-10 text-center shrink-0" :class="medalColor(rank)">
      {{ rank }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="display-font text-lg sm:text-xl truncate">{{ name }}</div>
      <div class="mono text-[0.6rem] sm:text-[0.65rem] text-[var(--text-dim)] uppercase tracking-wider truncate">
        {{ gender === 'M' ? 'M' : 'F' }} · 量測 {{ score.measureCount }}/4 · 運動 {{ score.workoutDays }}d · 飲食 {{ score.dietDays }}d
      </div>
    </div>
    <div class="text-right shrink-0">
      <div class="display-font text-2xl sm:text-3xl text-[var(--accent)] glow-accent tabular-nums">
        {{ scoreDisplay }}
      </div>
      <div class="mono text-[0.6rem] sm:text-[0.65rem] text-[var(--text-dim)] uppercase">SCORE</div>
    </div>
  </NuxtLink>
</template>
