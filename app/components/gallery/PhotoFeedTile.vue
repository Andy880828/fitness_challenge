<script setup lang="ts">
import type { PhotoWithOwner } from '#shared/types/photo'

interface Props {
  photo: PhotoWithOwner
}
const props = defineProps<Props>()
const emit = defineEmits<{ open: [src: string] }>()

const relativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return iso.slice(0, 10)
}

const ago = computed(() => relativeTime(props.photo.uploadedAt))
</script>

<template>
  <div class="relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] group">
    <button type="button" class="w-full h-full" @click="emit('open', photo.publicUrl)">
      <img
        :src="photo.publicUrl"
        :alt="`${photo.owner.name} 於 ${photo.date}`"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
    </button>

    <NuxtLink
      :to="`/profile/${photo.owner.id}`"
      class="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent text-white text-xs flex justify-between items-center"
      @click.stop
    >
      <span class="font-bold truncate flex items-center gap-1">
        <span
          class="w-1.5 h-1.5 rounded-full inline-block"
          :class="photo.owner.gender === 'M' ? 'bg-[var(--accent)]' : 'bg-[var(--photo)]'"
        />
        {{ photo.owner.name }}
      </span>
      <span class="mono text-[0.6rem] opacity-80">{{ ago }}</span>
    </NuxtLink>
  </div>
</template>
