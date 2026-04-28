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
  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
    <div
      v-for="p in photos"
      :key="p.id"
      class="relative aspect-square overflow-hidden rounded border border-[var(--border)] group"
    >
      <button type="button" class="w-full h-full" @click="emit('view', p.publicUrl)">
        <img :src="p.publicUrl" :alt="p.date" class="w-full h-full object-cover">
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="刪除"
        @click.stop="emit('delete', p.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
