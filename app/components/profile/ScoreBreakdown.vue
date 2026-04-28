<script setup lang="ts">
import type { ScoreBreakdown as ScoreData } from '#shared/types/score'

interface Props {
  score: ScoreData
}
const props = defineProps<Props>()

const rows = computed(() => [
  {
    label: '減脂 (40%)',
    value: props.score.fatScore,
    delta: props.score.fatChange,
    suffix: '% 變化',
    color: 'var(--accent-2)',
  },
  {
    label: '增肌 (40%)',
    value: props.score.muscleScore,
    delta: props.score.muscleChange,
    suffix: '% 變化',
    color: 'var(--accent)',
  },
  {
    label: '過程 (20%)',
    value: props.score.processScore,
    delta: null,
    suffix: '',
    color: 'var(--photo)',
  },
])
</script>

<template>
  <div class="card p-5">
    <div class="flex items-baseline justify-between mb-4">
      <div class="mono text-xs uppercase tracking-wider text-[var(--text-dim)]">
        綜合分數
      </div>
      <div class="display-font text-5xl text-[var(--accent)]">
        {{ score.total.toFixed(1) }}
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="row in rows" :key="row.label">
        <div class="flex justify-between text-xs mono mb-1">
          <span class="text-[var(--text-dim)]">{{ row.label }}</span>
          <span :style="{ color: row.color }">
            {{ row.value.toFixed(1) }}
            <template v-if="row.delta !== null"> · {{ row.delta.toFixed(1) }}{{ row.suffix }}</template>
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${Math.min(100, Math.max(0, row.value))}%`, background: row.color }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
