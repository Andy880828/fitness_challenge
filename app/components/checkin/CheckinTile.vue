<script setup lang="ts">
interface Props {
  active: boolean
  label: string
  icon?: string
  variant?: 'workout' | 'diet'
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { variant: 'workout', disabled: false })
const emit = defineEmits<{ toggle: [] }>()

const colorClass = computed(() => {
  if (!props.active) return 'border-[var(--border)] text-[var(--text-dim)]'
  return props.variant === 'workout'
    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
    : 'border-[var(--accent-2)] text-[var(--accent-2)] bg-[var(--accent-2)]/10'
})
</script>

<template>
  <button
    type="button"
    class="card p-5 text-center w-full transition-all duration-200 active:scale-[0.97]"
    :class="[
      colorClass,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5',
      active && variant === 'workout' ? 'glow-accent' : '',
      active && variant === 'diet' ? 'glow-warn' : '',
    ]"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <div class="text-3xl mb-2 transition-transform" :class="{ 'scale-110': active }">
      {{ icon ?? (active ? '✓' : '·') }}
    </div>
    <div class="mono text-xs uppercase tracking-wider">{{ label }}</div>
  </button>
</template>
