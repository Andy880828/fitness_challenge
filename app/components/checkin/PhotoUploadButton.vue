<script setup lang="ts">
import ProgressBar from '~/components/ui/ProgressBar.vue'

export type UploadStage = 'idle' | 'compressing' | 'uploading'

interface Props {
  disabled?: boolean
  stage?: UploadStage
  progress?: number
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  stage: 'idle',
  progress: 0,
})
const emit = defineEmits<{ select: [file: File] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const isBusy = computed(() => props.stage !== 'idle')

const onPick = () => {
  if (props.disabled || isBusy.value) return
  inputRef.value?.click()
}
const onChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <button
    type="button"
    class="card p-4 flex flex-col items-center justify-center text-center w-full aspect-square transition-colors"
    :class="[
      isBusy ? 'cursor-wait animate-pulse bg-[var(--surface-2)]' : 'hover:border-[var(--photo)]',
      disabled && !isBusy ? 'opacity-50 cursor-not-allowed' : '',
    ]"
    :disabled="disabled || isBusy"
    @click="onPick"
  >
    <template v-if="stage === 'compressing'">
      <div class="w-full flex flex-col items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-[var(--photo)]/30" />
        <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)]">
          壓縮中…
        </div>
      </div>
    </template>
    <template v-else-if="stage === 'uploading'">
      <div class="w-full flex flex-col items-center gap-2">
        <div class="text-[var(--photo)] mono text-sm font-bold">{{ progress }}%</div>
        <div class="w-3/4">
          <ProgressBar :value="progress" />
        </div>
        <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)]">
          上傳中…
        </div>
      </div>
    </template>
    <template v-else>
      <div class="text-3xl text-[var(--photo)]">+</div>
      <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mt-1">
        上傳飲食
      </div>
    </template>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onChange"
    >
  </button>
</template>
