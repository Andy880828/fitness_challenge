<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  hint?: string
  variant?: 'default' | 'accent' | 'warn'
}
withDefaults(defineProps<Props>(), { variant: 'default' })
</script>

<template>
  <div class="card p-5">
    <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mb-2">
      {{ label }}
    </div>
    <div
      class="display-font text-4xl"
      :class="{
        'text-[var(--accent)]': variant === 'accent',
        'text-[var(--accent-2)]': variant === 'warn',
      }"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="text-xs text-[var(--text-dim)] mt-1">{{ hint }}</div>
  </div>
</template>
