<script setup lang="ts">
import type { Photo } from '#shared/types/photo'

interface Props {
  photos: Photo[]
  canDelete?: boolean
}
defineProps<Props>()
const emit = defineEmits<{
  view: [src: string]
  delete: [id: string]
}>()
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    <div
      v-for="(p, idx) in photos"
      :key="p.id"
      v-motion
      :initial="{ opacity: 0, scale: 0.85 }"
      :visible-once="{ opacity: 1, scale: 1, transition: { delay: idx * 30, duration: 250 } }"
      class="relative aspect-square overflow-hidden rounded border border-[var(--border)] group transition-colors hover:border-[var(--accent)]"
    >
      <button type="button" class="w-full h-full" @click="emit('view', p.publicUrl)">
        <img :src="p.publicUrl" :alt="p.date" class="w-full h-full object-cover">
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
        aria-label="刪除"
        @click.stop="emit('delete', p.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
