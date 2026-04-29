<script setup lang="ts">
import type { Participant } from '#shared/types/participant'
import type { MeasurementsByWeek } from '#shared/types/measure'

const route = useRoute()
const id = computed(() => String(route.params.id))
useHead({ title: '參賽者 · 減脂增肌挑戰賽' })

const { getById } = useParticipants()
const { calc } = useScore()
const { load } = useProfileData()

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

onMounted(async () => {
  participant.value = await getById(id.value)
  if (!participant.value) return
  const data = await load(participant.value)
  measurements.value = data.measurements
  workoutDays.value = data.workoutDays
  dietDays.value = data.dietDays
  photoDays.value = data.photoDays
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

      <ProfileView
        v-if="score"
        :measurements="measurements"
        :workout-days="workoutDays"
        :diet-days="dietDays"
        :photo-days="photoDays"
        :score="score"
        :editable="false"
      />
    </div>
  </div>
</template>
