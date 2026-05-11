<script setup lang="ts">
import type { PhotoWithOwner } from '#shared/types/photo'
import { formatDateZh, todayStr } from '#shared/utils/date'

interface Props {
  photo: PhotoWithOwner
}
const props = defineProps<Props>()
const emit = defineEmits<{ open: [src: string] }>()

const dateLabel = computed(() => {
  const today = todayStr()
  if (props.photo.date === today) return '今天'
  return formatDateZh(props.photo.date)
})
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
      <span class="mono text-[0.6rem] opacity-80">{{ dateLabel }}</span>
    </NuxtLink>
  </div>
</template>
