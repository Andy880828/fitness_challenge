<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  hint?: string
  variant?: 'default' | 'accent' | 'warn'
  /** 啟用 count-up 動畫（僅 number value 有效） */
  animate?: boolean
}
const props = withDefaults(defineProps<Props>(), { variant: 'default', animate: false })

const isNumber = computed(() => typeof props.value === 'number')
const numericTarget = computed(() => (isNumber.value ? Number(props.value) : 0))
const animatedValue = useCountUp(numericTarget, { duration: 800, decimals: 0 })

const display = computed(() => {
  if (props.animate && isNumber.value) return animatedValue.value
  return props.value
})

const glowClass = computed(() => {
  if (props.variant === 'accent') return 'text-[var(--accent)] glow-accent'
  if (props.variant === 'warn') return 'text-[var(--accent-2)] glow-warn'
  return ''
})
</script>

<template>
  <div class="card card-hover p-5">
    <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mb-2">
      {{ label }}
    </div>
    <div
      class="display-font text-3xl md:text-4xl"
      :class="glowClass"
    >
      {{ display }}
    </div>
    <div v-if="hint" class="text-xs text-[var(--text-dim)] mt-1">{{ hint }}</div>
  </div>
</template>
