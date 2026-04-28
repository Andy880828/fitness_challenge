<script setup lang="ts">
interface Props {
  disabled?: boolean
}
defineProps<Props>()
const emit = defineEmits<{ select: [file: File] }>()

const inputRef = ref<HTMLInputElement | null>(null)

const onPick = () => inputRef.value?.click()
const onChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <button
    type="button"
    class="card p-4 flex flex-col items-center justify-center text-center w-full aspect-square hover:border-[var(--photo)] transition-colors"
    :disabled="disabled"
    @click="onPick"
  >
    <div class="text-3xl text-[var(--photo)]">+</div>
    <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mt-1">
      上傳飲食
    </div>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onChange"
    >
  </button>
</template>
