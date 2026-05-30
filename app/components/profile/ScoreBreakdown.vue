<script setup lang="ts">
import type { ScoreBreakdown as ScoreData } from '#shared/types/score'
import { SCORE_CONST, PROCESS_TOTAL_CHECKS } from '#shared/utils/constants'

interface Props {
  score: ScoreData
  /** 用於顯示性別常數（FAT_CAP / MUS_CAP），可選；無則用 M */
  gender?: 'M' | 'F'
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

const consts = computed(() => SCORE_CONST[props.gender ?? 'M'])

const totalChecks = computed(
  () => props.score.workoutDays + props.score.dietDays + props.score.photoDays,
)

const rows = computed(() => [
  {
    label: '減脂 (40%)',
    value: props.score.fatScore,
    max: 40,
    color: 'var(--accent-2)',
    /** 「9.9% × 2.14 → 21.21 / 25」風格 */
    detail: props.score.start
      ? `${props.score.fatChange.toFixed(1)}% × ${props.score.fatCoef.toFixed(2)} → ${props.score.weightedFat.toFixed(1)}/${consts.value.FAT_CAP}`
      : '未量測',
  },
  {
    label: '增肌 (40%)',
    value: props.score.muscleScore,
    max: 40,
    color: 'var(--accent)',
    detail: props.score.start
      ? props.score.avgSmmReady
        ? `${props.score.muscleChange.toFixed(1)}% × ${props.score.musCoef.toFixed(2)} → ${props.score.weightedMus.toFixed(1)}/${consts.value.MUS_CAP}`
        : `${props.score.muscleChange.toFixed(1)}%（AVG_SMM 計算中）`
      : '未量測',
  },
  {
    label: '過程 (20%)',
    value: props.score.processScore,
    max: 20,
    color: 'var(--photo)',
    detail: `${totalChecks.value}/${PROCESS_TOTAL_CHECKS} 勾`,
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
            {{ row.value.toFixed(1) }} / {{ row.max }}
            <span class="text-[var(--text-dim)]"> · {{ row.detail }}</span>
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: mounted ? `${Math.min(100, Math.max(0, (row.value / row.max) * 100))}%` : '0%',
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
