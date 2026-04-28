<script setup lang="ts">
import type { Participant } from '#shared/types/participant'
import type { MeasurementsByWeek } from '#shared/types/measure'

const route = useRoute()
const id = computed(() => String(route.params.id))
useHead({ title: '參賽者 · 減脂增肌挑戰賽' })

const { getById } = useParticipants()
const { list: listMeasures } = useMeasures()
const { countAll } = useCheckins()
const { listByParticipant } = usePhotos()
const { calc } = useScore()

const participant = ref<Participant | null>(null)
const measurements = ref<MeasurementsByWeek>({})
const workoutDays = ref(0)
const dietDays = ref(0)
const photoDays = ref(0)

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

const weightSeries = computed(() =>
  Object.values(measurements.value)
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map(m => m.weight),
)

onMounted(async () => {
  participant.value = await getById(id.value)
  if (!participant.value) return
  const [m, c, p] = await Promise.all([
    listMeasures(participant.value.id),
    countAll(participant.value.id),
    listByParticipant(participant.value.id),
  ])
  measurements.value = m
  workoutDays.value = c.workoutDays
  dietDays.value = c.dietDays
  photoDays.value = Object.keys(p).length
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10">
    <NuxtLink to="/leaderboard" class="btn-ghost px-3 py-1 rounded text-xs">
      ← 回排行榜
    </NuxtLink>

    <div v-if="!participant" class="card p-8 text-center text-[var(--text-dim)] mono mt-6">
      載入中...
    </div>

    <div v-else class="mt-4">
      <div class="text-xs text-[var(--accent)] mono mb-2">// PARTICIPANT PROFILE</div>
      <h1 class="display-font text-5xl mb-6">{{ participant.name }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <MeasureBlock :measurements="measurements" :editable="false" />
          <div v-if="weightSeries.length >= 2" class="card p-5">
            <div class="mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
              體重趨勢
            </div>
            <Sparkline :values="weightSeries" :width="300" :height="80" />
          </div>
        </div>
        <div v-if="score">
          <ScoreBreakdown :score="score" />
        </div>
      </div>
    </div>
  </div>
</template>
