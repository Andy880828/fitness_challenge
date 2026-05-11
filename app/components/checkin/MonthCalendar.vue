<script setup lang="ts">
import type { CheckinsByDate } from '#shared/types/checkin'
import type { PhotosByDate } from '#shared/types/photo'
import { CHECKIN_BACKFILL_DAYS, WEEKDAY_LABELS } from '#shared/utils/constants'
import { addDays, measureDates, todayStr } from '#shared/utils/date'

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
const today = computed(() => todayStr())

interface Cell {
  iso: string | null
  day: number | null
  inMonth: boolean
  isFuture: boolean
  isPastLimit: boolean
}

const cells = computed<Cell[]>(() => {
  const first = new Date(Date.UTC(props.year, props.month - 1, 1))
  const startWeekday = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(props.year, props.month, 0)).getUTCDate()
  const todayIso = today.value
  const earliest = addDays(todayIso, -CHECKIN_BACKFILL_DAYS)
  const result: Cell[] = []
  for (let i = 0; i < startWeekday; i += 1) {
    result.push({ iso: null, day: null, inMonth: false, isFuture: false, isPastLimit: false })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${props.year}-${String(props.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({
      iso,
      day: d,
      inMonth: true,
      isFuture: iso > todayIso,
      isPastLimit: iso < earliest,
    })
  }
  while (result.length % 7 !== 0) {
    result.push({ iso: null, day: null, inMonth: false, isFuture: false, isPastLimit: false })
  }
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

const onClickCell = (cell: Cell) => {
  if (!cell.iso || cell.isFuture || cell.isPastLimit) return
  emit('select', cell.iso)
}
</script>

<template>
  <div class="card p-2 sm:p-4">
    <div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 text-center mono text-[0.65rem] sm:text-xs text-[var(--text-dim)]">
      <div v-for="w in WEEKDAY_LABELS" :key="w">{{ w }}</div>
    </div>
    <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
      <button
        v-for="(cell, i) in cells"
        :key="i"
        type="button"
        :disabled="!cell.inMonth || cell.isFuture || cell.isPastLimit"
        class="aspect-square rounded text-xs sm:text-sm flex flex-col items-center justify-center relative transition-colors border-2"
        :class="[
          cell.inMonth ? 'border-transparent' : 'border-transparent',
          cell.isFuture || cell.isPastLimit ? 'opacity-40 cursor-not-allowed' : '',
          cell.iso === startDate ? 'ring-2 ring-[var(--photo)]' : '',
          cell.iso === today ? 'ring-2 ring-[var(--today)]' : '',
          selected === cell.iso ? '!border-[var(--selected)] bg-[var(--selected)]/10' : '',
          dotsFor(cell.iso).measure ? 'ring-1 ring-[var(--text-dim)]/40' : '',
        ]"
        @click="onClickCell(cell)"
      >
        <span v-if="cell.day" :class="cell.inMonth ? '' : 'opacity-30'">
          {{ cell.day }}
        </span>
        <div v-if="cell.iso" class="flex gap-0.5 mt-0.5 sm:mt-1 h-1 sm:h-1.5">
          <span
            v-if="dotsFor(cell.iso).workout"
            class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[var(--accent)]"
          />
          <span
            v-if="dotsFor(cell.iso).diet"
            class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[var(--accent-2)]"
          />
          <span
            v-if="dotsFor(cell.iso).photo"
            class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[var(--photo)]"
          />
        </div>
      </button>
    </div>

    <div class="mono text-[0.6rem] sm:text-[0.65rem] text-[var(--text-dim)] mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
      <span class="flex items-center gap-1">
        <span class="inline-block w-2.5 h-2.5 rounded-sm ring-2 ring-[var(--photo)]" />
        開始
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-2.5 h-2.5 rounded-sm ring-2 ring-[var(--today)]" />
        今日
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-2.5 h-2.5 rounded-sm border-2 border-[var(--selected)] bg-[var(--selected)]/10" />
        所選
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-[var(--text-dim)]/40" />
        量測
      </span>
    </div>
  </div>
</template>
