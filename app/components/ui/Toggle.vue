<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const onClick = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative inline-flex items-center h-6 w-11 rounded-full transition-colors disabled:opacity-50"
    :class="modelValue ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)] border border-[var(--border)]'"
    @click="onClick"
  >
    <span
      class="inline-block w-4 h-4 rounded-full bg-[var(--bg)] transition-transform"
      :style="{ transform: modelValue ? 'translateX(22px)' : 'translateX(4px)' }"
    />
  </button>
</template>
