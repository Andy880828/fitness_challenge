<script setup lang="ts">
interface Props {
  variant?: 'accent' | 'neutral' | 'warn'
}
withDefaults(defineProps<Props>(), { variant: 'neutral' })
</script>

<template>
  <span
    class="inline-block px-2 py-0.5 mono text-[0.65rem] uppercase tracking-wider rounded border"
    :class="{
      'border-[var(--accent)] text-[var(--accent)]': variant === 'accent',
      'border-[var(--border)] text-[var(--text-dim)]': variant === 'neutral',
      'border-[var(--accent-2)] text-[var(--accent-2)]': variant === 'warn',
    }"
  >
    <slot />
  </span>
</template>
