<script setup lang="ts">
import type { ScoreBreakdown } from '#shared/types/score'

interface Props {
  rank: number
  participantId: string
  name: string
  gender: 'M' | 'F'
  score: ScoreBreakdown
}
defineProps<Props>()

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
    class="card p-4 flex items-center gap-4 hover:border-[var(--accent)] transition-colors"
  >
    <div class="display-font text-3xl w-10 text-center" :class="medalColor(rank)">
      {{ rank }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="display-font text-xl truncate">{{ name }}</div>
      <div class="mono text-[0.65rem] text-[var(--text-dim)] uppercase tracking-wider">
        {{ gender === 'M' ? 'M' : 'F' }} · 量測 {{ score.measureCount }}/4 · 運動 {{ score.workoutDays }}d · 飲食 {{ score.dietDays }}d
      </div>
    </div>
    <div class="text-right">
      <div class="display-font text-3xl text-[var(--accent)]">
        {{ score.total.toFixed(1) }}
      </div>
      <div class="mono text-[0.65rem] text-[var(--text-dim)] uppercase">SCORE</div>
    </div>
  </NuxtLink>
</template>
