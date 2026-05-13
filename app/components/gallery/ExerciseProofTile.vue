<script setup lang="ts">
import type { ExerciseProofWithOwner } from '#shared/types/exercise'
import { formatDateZh, todayStr } from '#shared/utils/date'

interface Props {
  proof: ExerciseProofWithOwner
}
const props = defineProps<Props>()
const emit = defineEmits<{
  open: [payload: { src?: string; text?: string }]
}>()

const dateLabel = computed(() => {
  const today = todayStr()
  if (props.proof.date === today) return '今天'
  return formatDateZh(props.proof.date)
})

const onClick = () => {
  if (props.proof.kind === 'photo' && props.proof.publicUrl) {
    emit('open', { src: props.proof.publicUrl })
  } else if (props.proof.kind === 'note' && props.proof.note) {
    emit('open', { text: props.proof.note })
  }
}
</script>

<template>
  <div class="relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] group">
    <button
      type="button"
      class="w-full h-full"
      :class="proof.kind === 'note' ? 'bg-[var(--surface-2)]' : ''"
      @click="onClick"
    >
      <img
        v-if="proof.kind === 'photo' && proof.publicUrl"
        :src="proof.publicUrl"
        :alt="`${proof.owner.name} 於 ${proof.date}`"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center p-3 text-left"
      >
        <div class="mono text-[0.55rem] uppercase tracking-wider text-[var(--accent)] mb-2 self-start">
          // NOTE
        </div>
        <p
          class="text-xs md:text-sm leading-snug text-[var(--text)] line-clamp-6 whitespace-pre-wrap break-words"
        >
          {{ proof.note }}
        </p>
      </div>
    </button>

    <NuxtLink
      :to="`/profile/${proof.owner.id}`"
      class="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent text-white text-xs flex justify-between items-center"
      @click.stop
    >
      <span class="font-bold truncate flex items-center gap-1">
        <span
          class="w-1.5 h-1.5 rounded-full inline-block"
          :class="proof.owner.gender === 'M' ? 'bg-[var(--accent)]' : 'bg-[var(--photo)]'"
        />
        {{ proof.owner.name }}
      </span>
      <span class="mono text-[0.6rem] opacity-80">{{ dateLabel }}</span>
    </NuxtLink>
  </div>
</template>
