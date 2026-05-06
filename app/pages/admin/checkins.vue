<script setup lang="ts">
import type { AdminCheckinRow } from '~/composables/useAdminCheckins'
import type { ParticipantWithStats } from '#shared/types/participant'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'auth' })
useHead({ title: '打卡管理 · 管理中心' })

const { list, update } = useAdminCheckins()
const { list: listParticipants } = useParticipants()

const rows = ref<AdminCheckinRow[]>([])
const participants = ref<ParticipantWithStats[]>([])
const filterParticipant = ref<string>('')
const filterFrom = ref<string>('')
const filterTo = ref<string>('')
const filterReviewed = ref<'' | 'true' | 'false'>('')
const loading = ref(false)
const busyKey = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const reload = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    rows.value = await list({
      participantId: filterParticipant.value || undefined,
      from: filterFrom.value || undefined,
      to: filterTo.value || undefined,
      reviewed:
        filterReviewed.value === 'true'
          ? true
          : filterReviewed.value === 'false'
            ? false
            : undefined,
    })
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

const keyOf = (r: AdminCheckinRow) => `${r.participant_id}:${r.date}`

const onToggle = async (
  row: AdminCheckinRow,
  field: 'workout' | 'diet',
  next: boolean,
) => {
  busyKey.value = keyOf(row)
  const { data, error } = await update(row.participant_id, row.date, { [field]: next })
  busyKey.value = null
  if (error || !data) {
    errorMsg.value = error ?? '更新失敗'
    return
  }
  rows.value = rows.value.map((r) => (keyOf(r) === keyOf(data) ? { ...r, ...data } : r))
}

const onReview = async (row: AdminCheckinRow) => {
  busyKey.value = keyOf(row)
  const { data, error } = await update(row.participant_id, row.date, { markReviewed: true })
  busyKey.value = null
  if (error || !data) {
    errorMsg.value = error ?? '審核失敗'
    return
  }
  rows.value = rows.value.map((r) => (keyOf(r) === keyOf(data) ? { ...r, ...data } : r))
}

onMounted(async () => {
  participants.value = await listParticipants()
  await reload()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div>
        <div class="text-xs text-[var(--accent)] mono mb-2">// ADMIN / CHECKINS</div>
        <h1 class="display-font text-2xl md:text-4xl">打卡管理</h1>
      </div>
      <NuxtLink to="/admin" class="text-xs mono text-[var(--text-dim)] hover:text-[var(--accent)]">
        ← 回管理中心
      </NuxtLink>
    </div>

    <div class="grid gap-3 md:grid-cols-5 mb-4 p-3 border border-[var(--border)] rounded">
      <select
        v-model="filterParticipant"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
      >
        <option value="">全部參賽者</option>
        <option v-for="p in participants" :key="p.id" :value="p.id">
          {{ p.name }} ({{ p.gender }})
        </option>
      </select>
      <input
        v-model="filterFrom"
        type="date"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
        placeholder="從"
      />
      <input
        v-model="filterTo"
        type="date"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
        placeholder="至"
      />
      <select
        v-model="filterReviewed"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
      >
        <option value="">全部狀態</option>
        <option value="true">已審核</option>
        <option value="false">未審核</option>
      </select>
      <button
        type="button"
        class="px-3 py-1 text-sm mono rounded"
        style="background: var(--accent); color: var(--bg)"
        @click="reload"
      >
        套用篩選
      </button>
    </div>

    <p v-if="errorMsg" class="mono text-sm text-[var(--accent-2)] mb-3">{{ errorMsg }}</p>

    <div class="border border-[var(--border)] rounded overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-[var(--bg-elevated,#111)] mono text-xs text-[var(--text-dim)]">
          <tr>
            <th class="px-3 py-2 text-left">參賽者</th>
            <th class="px-3 py-2 text-left">日期</th>
            <th class="px-3 py-2 text-center">運動</th>
            <th class="px-3 py-2 text-center">飲食</th>
            <th class="px-3 py-2 text-left">審核時間</th>
            <th class="px-3 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <AdminCheckinRow
            v-for="row in rows"
            :key="`${row.participant_id}:${row.date}`"
            :row="row"
            :busy="busyKey === `${row.participant_id}:${row.date}`"
            @toggle="(field, next) => onToggle(row, field, next)"
            @review="onReview(row)"
          />
          <tr v-if="!loading && rows.length === 0">
            <td colspan="6" class="px-3 py-8 text-center text-sm text-[var(--text-dim)]">
              無資料
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="loading" class="mono text-xs text-[var(--text-dim)] mt-3">載入中…</p>
  </div>
</template>
