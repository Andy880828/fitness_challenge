<script setup lang="ts">
interface Props {
  src: string | null
  alt?: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    v-if="src"
    class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <button
      class="absolute top-4 right-4 text-white text-3xl mono"
      aria-label="關閉"
      @click="emit('close')"
    >
      ×
    </button>
    <img
      :src="src ?? ''"
      :alt="alt ?? '飲食照片'"
      class="max-w-full max-h-full object-contain"
    >
  </div>
</template>
