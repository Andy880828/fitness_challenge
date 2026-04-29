<script setup lang="ts">
import type { MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'

interface Props {
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
  score: ScoreBreakdown
  editable?: boolean
}
const props = withDefaults(defineProps<Props>(), { editable: false })

const emit = defineEmits<{
  saveMeasure: [weekIndex: WeekIndex, weight: number, fatPct: number, muscle: number]
}>()

const onSave = (
  weekIndex: WeekIndex,
  weight: number,
  fatPct: number,
  muscle: number,
) => {
  emit('saveMeasure', weekIndex, weight, fatPct, muscle)
}

const weightSeries = computed(() =>
  Object.values(props.measurements)
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map(m => m.weight),
)
</script>

<template>
  <div class="space-y-6">
    <div v-if="editable" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="運動天數" :value="workoutDays" variant="accent" />
      <StatCard label="飲食天數" :value="dietDays" variant="warn" />
      <StatCard label="拍照天數" :value="photoDays" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <h2 v-if="editable" class="display-font text-2xl">InBody 量測</h2>
        <MeasureBlock
          :measurements="measurements"
          :editable="editable"
          @save="onSave"
        />
        <div v-if="weightSeries.length >= 2" class="card p-5">
          <div class="mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
            體重趨勢
          </div>
          <Sparkline :values="weightSeries" :width="300" :height="80" />
        </div>
      </div>
      <div>
        <h2 v-if="editable" class="display-font text-2xl mb-4">分數</h2>
        <ScoreBreakdown :score="score" />
      </div>
    </div>
  </div>
</template>
