<script setup lang="ts">
import type { ExerciseProof } from '#shared/types/exercise'

type Stage = 'idle' | 'compressing' | 'uploading'

interface Props {
  open: boolean
  participantId: string
  date: string
  proofs: ExerciseProof[]
  busy?: boolean
}
const props = withDefaults(defineProps<Props>(), { busy: false })
const emit = defineEmits<{
  confirm: []
  close: []
  'proof-added': [proof: ExerciseProof]
  'proof-removed': [id: string]
}>()

const { addPhoto, addNote, remove } = useExerciseProofs()

const mode = ref<'menu' | 'note'>('menu')
const noteText = ref('')
const stage = ref<Stage>('idle')
const progress = ref(0)
const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const canConfirm = computed(() => props.proofs.length >= 1 && stage.value === 'idle')
const NOTE_MAX = 500

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && stage.value === 'idle') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(() => props.open, (v) => {
  if (v) {
    mode.value = 'menu'
    noteText.value = ''
    error.value = null
    stage.value = 'idle'
    progress.value = 0
  }
})

const onPickFile = () => {
  if (stage.value !== 'idle') return
  fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return
  error.value = null
  stage.value = 'compressing'
  progress.value = 0
  const res = await addPhoto(props.participantId, props.date, file, {
    onCompressProgress: (pct) => {
      progress.value = pct
    },
    onUploadProgress: (pct) => {
      if (stage.value !== 'uploading') stage.value = 'uploading'
      progress.value = pct
    },
  })
  stage.value = 'idle'
  progress.value = 0
  if (res.error) {
    error.value = res.error
  } else if (res.data) {
    emit('proof-added', res.data)
  }
}

const onSaveNote = async () => {
  if (stage.value !== 'idle') return
  error.value = null
  const text = noteText.value.trim()
  if (!text) {
    error.value = '請輸入文字證明'
    return
  }
  stage.value = 'uploading'
  const res = await addNote(props.participantId, props.date, text)
  stage.value = 'idle'
  if (res.error) {
    error.value = res.error
  } else if (res.data) {
    emit('proof-added', res.data)
    noteText.value = ''
    mode.value = 'menu'
  }
}

const onRemoveProof = async (id: string) => {
  if (stage.value !== 'idle') return
  const res = await remove(id)
  if (res.error) {
    error.value = res.error
  } else {
    emit('proof-removed', id)
  }
}

const onConfirm = () => {
  if (!canConfirm.value) return
  emit('confirm')
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[110] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
    @click.self="stage === 'idle' && emit('close')"
  >
    <div
      class="card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
      @click.stop
    >
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="mono text-xs text-[var(--accent)]">// EXERCISE PROOF</div>
          <h2 class="display-font text-xl md:text-2xl mt-1">運動打卡證明</h2>
          <p class="mono text-[0.65rem] text-[var(--text-dim)] mt-1">
            {{ date }} · 至少需要 1 筆證明（照片或文字）
          </p>
        </div>
        <button
          class="text-2xl text-[var(--text-dim)] hover:text-[var(--text)] -m-1 p-1"
          :disabled="stage !== 'idle'"
          aria-label="關閉"
          @click="emit('close')"
        >×</button>
      </div>

      <p v-if="error" class="mono text-xs text-[var(--accent-2)] mb-3">{{ error }}</p>

      <!-- 已有證明列表 -->
      <div v-if="proofs.length > 0" class="mb-4 space-y-2">
        <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)]">
          目前證明（{{ proofs.length }}）
        </div>
        <div class="space-y-2">
          <div
            v-for="p in proofs"
            :key="p.id"
            class="flex items-center gap-3 p-2 rounded border border-[var(--border)]"
          >
            <div v-if="p.kind === 'photo' && p.publicUrl" class="w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <img :src="p.publicUrl" alt="運動證明" class="w-full h-full object-cover">
            </div>
            <div v-else class="w-12 h-12 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] mono text-xs flex-shrink-0">
              文字
            </div>
            <div class="flex-1 min-w-0 text-sm truncate">
              <template v-if="p.kind === 'note'">{{ p.note }}</template>
              <span v-else class="text-[var(--text-dim)]">照片證明</span>
            </div>
            <button
              class="text-[var(--accent-2)] mono text-xs px-2 py-1"
              :disabled="stage !== 'idle'"
              @click="onRemoveProof(p.id)"
            >刪除</button>
          </div>
        </div>
      </div>

      <!-- 新增動作 -->
      <template v-if="mode === 'menu'">
        <div class="grid grid-cols-2 gap-3 mb-4">
          <button
            class="card p-4 text-center hover:border-[var(--photo)] transition-colors disabled:opacity-50"
            :disabled="stage !== 'idle'"
            @click="onPickFile"
          >
            <div class="text-2xl text-[var(--photo)]">＋</div>
            <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mt-1">
              上傳照片
            </div>
          </button>
          <button
            class="card p-4 text-center hover:border-[var(--accent)] transition-colors disabled:opacity-50"
            :disabled="stage !== 'idle'"
            @click="mode = 'note'"
          >
            <div class="text-2xl text-[var(--accent)]">✎</div>
            <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mt-1">
              寫文字
            </div>
          </button>
        </div>

        <div v-if="stage === 'compressing'" class="mono text-[0.65rem] text-[var(--text-dim)] text-center mb-2">
          壓縮中… {{ progress }}%
        </div>
        <div v-else-if="stage === 'uploading'" class="mono text-[0.65rem] text-[var(--text-dim)] text-center mb-2">
          上傳中… {{ progress }}%
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        >
      </template>

      <!-- 文字輸入模式 -->
      <template v-else>
        <div class="mb-4 space-y-2">
          <label class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)]">
            文字證明（{{ noteText.length }} / {{ NOTE_MAX }}）
          </label>
          <textarea
            v-model="noteText"
            :maxlength="NOTE_MAX"
            rows="4"
            class="input w-full resize-none"
            placeholder="例：今天慢跑 5 公里，配速 6:30"
          />
          <div class="flex gap-2">
            <button
              class="btn-ghost flex-1 py-2 mono text-xs"
              :disabled="stage !== 'idle'"
              @click="mode = 'menu'; noteText = ''"
            >取消</button>
            <button
              class="btn-primary flex-1 py-2 mono text-xs"
              :disabled="stage !== 'idle' || !noteText.trim()"
              @click="onSaveNote"
            >儲存文字</button>
          </div>
        </div>
      </template>

      <!-- 完成打卡 -->
      <button
        class="btn-primary w-full py-3 mono text-sm tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canConfirm"
        @click="onConfirm"
      >
        {{ canConfirm ? '完成打卡' : '至少加 1 筆證明' }}
      </button>
    </div>
  </div>
</template>
