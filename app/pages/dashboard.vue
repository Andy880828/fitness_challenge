<script setup lang="ts">
import type { MeasurementsByWeek, WeekIndex } from '#shared/types/measure'

definePageMeta({ middleware: 'auth', layout: 'auth' })
useHead({ title: '我的儀表板 · 減脂增肌挑戰賽' })

const { participant } = useParticipantContext()
const { upsert: upsertMeasure } = useMeasures()
const { calc } = useScore()
const { load } = useProfileData()

const measurements = ref<MeasurementsByWeek>({})
const workoutDays = ref(0)
const dietDays = ref(0)
const photoDays = ref(0)
const error = ref<string | null>(null)

const score = computed(() => {
  if (!participant.value) return null
  return calc({
    gender: participant.value.gender,
    measurements: measurements.value,
    workoutDays: workoutDays.value,
    dietDays: dietDays.value,
    photoDays: photoDays.value,
  })
})

const reload = async () => {
  if (!participant.value) return
  const data = await load(participant.value)
  measurements.value = data.measurements
  workoutDays.value = data.workoutDays
  dietDays.value = data.dietDays
  photoDays.value = data.photoDays
}

watch(participant, (p) => {
  if (p) reload()
}, { immediate: true })

const onSaveMeasure = async (
  weekIndex: WeekIndex,
  weight: number,
  fatPct: number,
  muscle: number,
) => {
  if (!participant.value) return
  const res = await upsertMeasure(participant.value.id, weekIndex, { weight, fatPct, muscle })
  if (res.error) {
    error.value = res.error
    return
  }
  if (res.data) {
    measurements.value = { ...measurements.value, [weekIndex]: res.data }
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="mb-6">
      <div class="text-xs text-[var(--accent)] mono mb-2">// MY DASHBOARD</div>
      <h1 class="display-font text-3xl md:text-5xl break-words">{{ participant?.name ?? '儀表板' }}</h1>
    </div>

    <p v-if="error" class="mono text-sm text-[var(--accent-2)] mb-4">{{ error }}</p>

    <ProfileView
      v-if="participant && score"
      :measurements="measurements"
      :workout-days="workoutDays"
      :diet-days="dietDays"
      :photo-days="photoDays"
      :score="score"
      :editable="true"
      @save-measure="onSaveMeasure"
    />
  </div>
</template>
