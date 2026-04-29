<script setup lang="ts">
import type { ScoreBreakdown as ScoreData } from '#shared/types/score'

interface Props {
  score: ScoreData
}
const props = defineProps<Props>()

const totalTarget = computed(() => props.score.total)
const totalDisplay = useCountUp(totalTarget, { duration: 900, decimals: 1 })

// 進度條 mount 後才填寬度，讓 CSS transition 觸發 0→value 動畫
const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

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
  <div class="card card-hover p-5">
    <div class="flex items-baseline justify-between mb-4">
      <div class="mono text-xs uppercase tracking-wider text-[var(--text-dim)]">
        綜合分數
      </div>
      <div class="display-font text-4xl md:text-5xl text-[var(--accent)] glow-accent tabular-nums">
        {{ totalDisplay }}
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="(row, idx) in rows" :key="row.label">
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
            :style="{
              width: mounted ? `${Math.min(100, Math.max(0, row.value))}%` : '0%',
              background: row.color,
              transitionDelay: `${100 + idx * 80}ms`,
              transitionDuration: '700ms',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
