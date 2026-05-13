<script setup lang="ts">
import type { AdminExerciseProofRow } from '~/composables/useAdminExerciseProofs'

interface Props {
  proof: AdminExerciseProofRow
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
      >
    </label>

    <span
      class="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[0.6rem] mono rounded bg-black/60"
      :class="proof.kind === 'photo' ? 'text-[var(--photo)]' : 'text-[var(--accent)]'"
    >
      {{ proof.kind === 'photo' ? '照片' : '文字' }}
    </span>

    <button
      type="button"
      class="block w-full aspect-square text-left"
      :class="proof.kind === 'note' ? 'bg-[var(--surface-2)]' : ''"
      @click="emit('preview')"
    >
      <img
        v-if="proof.kind === 'photo' && proof.public_url"
        :src="proof.public_url"
        :alt="proof.date"
        class="block w-full h-full object-cover"
        loading="lazy"
      >
      <div
        v-else
        class="w-full h-full flex flex-col p-3"
      >
        <div class="mono text-[0.55rem] uppercase tracking-wider text-[var(--accent)] mb-2">
          // NOTE
        </div>
        <p class="text-xs leading-snug text-[var(--text)] line-clamp-6 whitespace-pre-wrap break-words">
          {{ proof.note }}
        </p>
      </div>
    </button>

    <div class="p-2 text-xs mono">
      <div>{{ proof.participants?.name ?? '—' }}</div>
      <div class="text-[var(--text-dim)]">{{ proof.date }}</div>
    </div>
  </div>
</template>
