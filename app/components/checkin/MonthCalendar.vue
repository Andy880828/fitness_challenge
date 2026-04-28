<script setup lang="ts">
import type { CheckinsByDate } from '#shared/types/checkin'
import type { PhotosByDate } from '#shared/types/photo'
import { WEEKDAY_LABELS } from '#shared/utils/constants'
import { measureDates } from '#shared/utils/date'

interface Props {
  year: number
  month: number // 1..12
  checkins: CheckinsByDate
  photos: PhotosByDate
  startDate: string
  selected: string | null
}
const props = defineProps<Props>()
const emit = defineEmits<{ select: [date: string] }>()

const measureSet = computed(() => new Set(measureDates(props.startDate)))

interface Cell {
  iso: string | null
  day: number | null
  inMonth: boolean
}

const cells = computed<Cell[]>(() => {
  const first = new Date(Date.UTC(props.year, props.month - 1, 1))
  const startWeekday = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(props.year, props.month, 0)).getUTCDate()
  const result: Cell[] = []
  for (let i = 0; i < startWeekday; i += 1) result.push({ iso: null, day: null, inMonth: false })
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${props.year}-${String(props.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({ iso, day: d, inMonth: true })
  }
  while (result.length % 7 !== 0) result.push({ iso: null, day: null, inMonth: false })
  return result
})

const dotsFor = (iso: string | null) => {
  if (!iso) return { workout: false, diet: false, photo: false, measure: false }
  const c = props.checkins[iso]
  return {
    workout: !!c?.workout,
    diet: !!c?.diet,
    photo: (props.photos[iso]?.length ?? 0) > 0,
    measure: measureSet.value.has(iso),
  }
}
</script>

<template>
  <div class="card p-4">
    <div class="grid grid-cols-7 gap-1 mb-2 text-center mono text-xs text-[var(--text-dim)]">
      <div v-for="w in WEEKDAY_LABELS" :key="w">{{ w }}</div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(cell, i) in cells"
        :key="i"
        type="button"
        :disabled="!cell.inMonth"
        class="aspect-square border rounded text-sm flex flex-col items-center justify-center relative transition-colors"
        :class="[
          cell.inMonth ? 'border-[var(--border)]' : 'border-transparent',
          selected === cell.iso ? 'border-[var(--accent)] bg-[var(--accent)]/5' : '',
          dotsFor(cell.iso).measure ? 'ring-1 ring-[var(--photo)]' : '',
        ]"
        @click="cell.iso && emit('select', cell.iso)"
      >
        <span v-if="cell.day" :class="cell.inMonth ? '' : 'opacity-30'">
          {{ cell.day }}
        </span>
        <div v-if="cell.iso" class="flex gap-0.5 mt-1 h-1.5">
          <span
            v-if="dotsFor(cell.iso).workout"
            class="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
          />
          <span
            v-if="dotsFor(cell.iso).diet"
            class="w-1.5 h-1.5 rounded-full bg-[var(--accent-2)]"
          />
          <span
            v-if="dotsFor(cell.iso).photo"
            class="w-1.5 h-1.5 rounded-full bg-[var(--photo)]"
          />
        </div>
      </button>
    </div>
  </div>
</template>
