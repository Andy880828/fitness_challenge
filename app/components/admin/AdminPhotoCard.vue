<script setup lang="ts">
import type { AdminPhotoRow } from '~/composables/useAdminPhotos'

interface Props {
  photo: AdminPhotoRow
  selected: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: []
  preview: []
}>()
</script>

<template>
  <div
    class="relative border rounded overflow-hidden cursor-pointer"
    :class="selected ? 'border-[var(--accent)]' : 'border-[var(--border)]'"
  >
    <label class="absolute top-2 left-2 z-10 bg-black/60 rounded p-1 cursor-pointer">
      <input
        type="checkbox"
        :checked="selected"
        class="w-4 h-4 cursor-pointer"
        @click.stop
        @change="emit('toggle')"
      />
    </label>

    <img
      :src="photo.public_url"
      :alt="photo.date"
      class="block w-full aspect-square object-cover"
      loading="lazy"
      @click="emit('preview')"
    />

    <div class="p-2 text-xs mono">
      <div>{{ photo.participants?.name ?? '—' }}</div>
      <div class="text-[var(--text-dim)]">{{ photo.date }}</div>
    </div>
  </div>
</template>
