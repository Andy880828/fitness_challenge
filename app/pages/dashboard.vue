<script setup lang="ts">
import type { Participant } from '#shared/types/participant'
import type { MeasurementsByWeek, WeekIndex } from '#shared/types/measure'

definePageMeta({ middleware: 'auth' })
useHead({ title: '我的儀表板 · 減脂增肌挑戰賽' })

const { getMine } = useParticipants()
const { list: listMeasures, upsert: upsertMeasure } = useMeasures()
const { countAll } = useCheckins()
const { listByParticipant } = usePhotos()
const { calc } = useScore()
const { signOut } = useAuth()

const participant = ref<Participant | null>(null)
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

const weightSeries = computed(() => {
  const ms = Object.values(measurements.value)
  return ms
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map(m => m.weight)
})

const reload = async () => {
  participant.value = await getMine()
  if (!participant.value) {
    error.value = '尚未報名，請先到 /register 完成報名'
    return
  }
  const [m, c, p] = await Promise.all([
    listMeasures(participant.value.id),
    countAll(participant.value.id),
    listByParticipant(participant.value.id),
  ])
  measurements.value = m
  workoutDays.value = c.workoutDays
  dietDays.value = c.dietDays
  photoDays.value = Object.keys(p).length
}

onMounted(reload)

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

const onLogout = async () => {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="text-xs text-[var(--accent)] mono mb-2">// MY DASHBOARD</div>
        <h1 class="display-font text-5xl">{{ participant?.name ?? '儀表板' }}</h1>
      </div>
      <button class="btn-ghost px-3 py-2 rounded text-xs mono" @click="onLogout">登出</button>
    </div>

    <p v-if="error" class="mono text-sm text-[var(--accent-2)] mb-4">{{ error }}</p>

    <div v-if="participant && score" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="運動天數" :value="workoutDays" variant="accent" />
        <StatCard label="飲食天數" :value="dietDays" variant="warn" />
        <StatCard label="拍照天數" :value="photoDays" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <h2 class="display-font text-2xl">InBody 量測</h2>
          <MeasureBlock
            :measurements="measurements"
            :editable="true"
            @save="onSaveMeasure"
          />
          <div v-if="weightSeries.length >= 2" class="card p-5">
            <div class="mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
              體重趨勢
            </div>
            <Sparkline :values="weightSeries" :width="300" :height="80" />
          </div>
        </div>
        <div>
          <h2 class="display-font text-2xl mb-4">分數</h2>
          <ScoreBreakdown :score="score" />
        </div>
      </div>
    </div>
  </div>
</template>
