<script setup lang="ts">
import type { MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'
import type { Gender } from '#shared/types/participant'

interface Props {
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
  score: ScoreBreakdown
  gender?: Gender
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
      <StatCard label="運動天數" :value="workoutDays" variant="accent" animate />
      <StatCard label="飲食天數" :value="dietDays" variant="warn" animate />
      <StatCard label="拍照天數" :value="photoDays" animate />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div class="lg:col-span-2 space-y-4 min-w-0">
        <h2 v-if="editable" class="display-font text-xl md:text-2xl">InBody 量測</h2>
        <MeasureBlock
          :measurements="measurements"
          :editable="editable"
          @save="onSave"
        />
        <div v-if="weightSeries.length >= 2" class="card p-4 md:p-5 overflow-hidden">
          <div class="mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
            體重趨勢
          </div>
          <Sparkline :values="weightSeries" :width="300" :height="80" />
        </div>
      </div>
      <div class="min-w-0">
        <h2 v-if="editable" class="display-font text-xl md:text-2xl mb-4">分數</h2>
        <ScoreBreakdown :score="score" :gender="gender" />
      </div>
    </div>
  </div>
</template>
