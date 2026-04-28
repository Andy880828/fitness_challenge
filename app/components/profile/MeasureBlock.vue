<script setup lang="ts">
import type { Measurement, MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import { MEASURE_LABELS } from '#shared/utils/constants'

interface Props {
  measurements: MeasurementsByWeek
  editable: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  save: [weekIndex: WeekIndex, weight: number, fatPct: number, muscle: number]
}>()

const editing = ref<WeekIndex | null>(null)
const draftWeight = ref<number | null>(null)
const draftFat = ref<number | null>(null)
const draftMuscle = ref<number | null>(null)

const startEdit = (week: WeekIndex) => {
  const m: Measurement | undefined = props.measurements[week]
  draftWeight.value = m?.weight ?? null
  draftFat.value = m?.fatPct ?? null
  draftMuscle.value = m?.muscle ?? null
  editing.value = week
}

const cancel = () => {
  editing.value = null
}

const save = () => {
  if (
    editing.value === null ||
    draftWeight.value == null ||
    draftFat.value == null ||
    draftMuscle.value == null
  )
    return
  emit('save', editing.value, draftWeight.value, draftFat.value, draftMuscle.value)
  editing.value = null
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div
      v-for="(label, idx) in MEASURE_LABELS"
      :key="idx"
      class="card p-4"
    >
      <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mb-2">
        {{ label }}
      </div>
      <template v-if="editing === idx">
        <div class="space-y-2">
          <input v-model.number="draftWeight" type="number" step="0.1" placeholder="體重 kg" class="input text-sm">
          <input v-model.number="draftFat" type="number" step="0.1" placeholder="體脂 %" class="input text-sm">
          <input v-model.number="draftMuscle" type="number" step="0.1" placeholder="肌肉 kg" class="input text-sm">
          <div class="flex gap-2">
            <button type="button" class="btn-primary px-2 py-1 rounded text-xs flex-1" @click="save">存</button>
            <button type="button" class="btn-ghost px-2 py-1 rounded text-xs flex-1" @click="cancel">取消</button>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-if="measurements[idx as WeekIndex]" class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-[var(--text-dim)]">體重</span>
            <span>{{ measurements[idx as WeekIndex]!.weight }} kg</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-dim)]">體脂</span>
            <span>{{ measurements[idx as WeekIndex]!.fatPct }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-dim)]">肌肉</span>
            <span>{{ measurements[idx as WeekIndex]!.muscle }} kg</span>
          </div>
        </div>
        <div v-else class="text-xs text-[var(--text-dim)] italic">尚未量測</div>
        <button
          v-if="editable"
          type="button"
          class="btn-ghost w-full mt-3 px-2 py-1 rounded text-xs"
          @click="startEdit(idx as WeekIndex)"
        >
          {{ measurements[idx as WeekIndex] ? '編輯' : '填寫' }}
        </button>
      </template>
    </div>
  </div>
</template>
