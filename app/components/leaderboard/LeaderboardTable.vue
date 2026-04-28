<script setup lang="ts">
import type { ParticipantWithStats, Gender } from '#shared/types/participant'
import type { MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'

interface Props {
  participants: ParticipantWithStats[]
  filter: Gender | 'ALL'
}
const props = defineProps<Props>()

const supabase = useSupabaseClient<any>()
const { calc } = useScore()

interface Row {
  participant: ParticipantWithStats
  score: ScoreBreakdown
}

const rows = ref<Row[]>([])
const loading = ref(true)

// 一次抓取所有相關 measurements，避免 N+1
const computeRows = async () => {
  loading.value = true
  const ids = props.participants.map(p => p.id)
  if (ids.length === 0) {
    rows.value = []
    loading.value = false
    return
  }
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .in('participant_id', ids)
  const byParticipant: Record<string, MeasurementsByWeek> = {}
  if (!error && data) {
    for (const r of data) {
      const m = byParticipant[r.participant_id] ?? {}
      m[r.week_index as WeekIndex] = {
        participantId: r.participant_id,
        weekIndex: r.week_index as WeekIndex,
        weight: Number(r.weight),
        fatPct: Number(r.fat_pct),
        muscle: Number(r.muscle),
        measuredOn: r.measured_on,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
      byParticipant[r.participant_id] = m
    }
  }

  const result: Row[] = props.participants.map(p => ({
    participant: p,
    score: calc({
      gender: p.gender,
      measurements: byParticipant[p.id] ?? {},
      workoutDays: p.workoutDays,
      dietDays: p.dietDays,
      photoDays: p.photoDays,
    }),
  }))

  result.sort((a, b) => b.score.total - a.score.total)
  rows.value = result
  loading.value = false
}

watch(() => props.participants, computeRows, { immediate: true })

const filtered = computed(() => {
  if (props.filter === 'ALL') return rows.value
  return rows.value.filter(r => r.participant.gender === props.filter)
})
</script>

<template>
  <div>
    <div v-if="loading" class="card p-8 text-center text-[var(--text-dim)] mono">
      載入中...
    </div>
    <div v-else-if="filtered.length === 0" class="card p-8 text-center text-[var(--text-dim)] mono">
      尚無參賽者
    </div>
    <div v-else class="space-y-2">
      <LeaderboardRow
        v-for="(row, idx) in filtered"
        :key="row.participant.id"
        :rank="idx + 1"
        :participant-id="row.participant.id"
        :name="row.participant.name"
        :gender="row.participant.gender"
        :score="row.score"
      />
    </div>
  </div>
</template>
