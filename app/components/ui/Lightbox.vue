<script setup lang="ts">
interface Props {
  src?: string | null
  text?: string | null
  alt?: string
}
const props = withDefaults(defineProps<Props>(), { src: null, text: null })
const emit = defineEmits<{ close: [] }>()

const isOpen = computed(() => !!props.src || !!props.text)

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    v-if="isOpen"
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
      v-if="src"
      :src="src"
      :alt="alt ?? '照片'"
      class="max-w-full max-h-full object-contain"
    >
    <div
      v-else-if="text"
      class="max-w-2xl w-full max-h-full overflow-y-auto bg-[var(--surface)] rounded-lg p-6 md:p-10 border border-[var(--border)]"
      @click.stop
    >
      <div class="mono text-xs uppercase tracking-wider text-[var(--accent)] mb-4">
        // EXERCISE NOTE
      </div>
      <p class="text-lg md:text-xl leading-relaxed whitespace-pre-wrap break-words text-[var(--text)]">
        {{ text }}
      </p>
    </div>
  </div>
</template>
