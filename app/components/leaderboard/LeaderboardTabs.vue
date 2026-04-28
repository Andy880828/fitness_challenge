<script setup lang="ts">
import type { Gender } from '#shared/types/participant'

interface Props {
  modelValue: Gender | 'ALL'
}
defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: Gender | 'ALL'] }>()

const tabs = [
  { value: 'ALL' as const, label: '全部' },
  { value: 'M' as const, label: '男子組' },
  { value: 'F' as const, label: '女子組' },
]
</script>

<template>
  <div class="flex gap-1 mb-4 mono text-xs">
    <button
      v-for="t in tabs"
      :key="t.value"
      type="button"
      class="px-4 py-2 border-b-2 transition-colors"
      :class="
        modelValue === t.value
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text)]'
      "
      @click="emit('update:modelValue', t.value)"
    >
      {{ t.label }}
    </button>
  </div>
</template>
