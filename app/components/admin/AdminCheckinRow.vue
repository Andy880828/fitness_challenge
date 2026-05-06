<script setup lang="ts">
import type { AdminCheckinRow } from '~/composables/useAdminCheckins'

interface Props {
  row: AdminCheckinRow
  busy?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: [field: 'workout' | 'diet', next: boolean]
  review: []
}>()
</script>

<template>
  <tr class="border-b border-[var(--border)]">
    <td class="px-3 py-2 text-sm">
      <div class="font-medium">{{ row.participants?.name ?? '—' }}</div>
      <div class="text-xs mono text-[var(--text-dim)]">{{ row.participants?.gender ?? '' }}</div>
    </td>
    <td class="px-3 py-2 text-sm mono">{{ row.date }}</td>
    <td class="px-3 py-2 text-center">
      <input
        type="checkbox"
        :checked="row.workout"
        :disabled="busy"
        class="w-4 h-4 cursor-pointer"
        @change="emit('toggle', 'workout', ($event.target as HTMLInputElement).checked)"
      />
    </td>
    <td class="px-3 py-2 text-center">
      <input
        type="checkbox"
        :checked="row.diet"
        :disabled="busy"
        class="w-4 h-4 cursor-pointer"
        @change="emit('toggle', 'diet', ($event.target as HTMLInputElement).checked)"
      />
    </td>
    <td class="px-3 py-2 text-xs mono text-[var(--text-dim)]">
      {{ row.reviewed_at ? new Date(row.reviewed_at).toLocaleString('zh-TW') : '—' }}
    </td>
    <td class="px-3 py-2">
      <button
        type="button"
        class="px-2 py-1 text-xs mono border border-[var(--border)] rounded hover:border-[var(--accent)]"
        :class="{ 'opacity-50': row.reviewed_at }"
        :disabled="busy"
        @click="emit('review')"
      >
        {{ row.reviewed_at ? '重新審核' : '標記已審核' }}
      </button>
    </td>
  </tr>
</template>
