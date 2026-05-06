<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  message?: string
  busy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '確認刪除',
  message: '請填寫刪除原因，將寫入稽核軌跡。',
  busy: false,
})

const emit = defineEmits<{
  cancel: []
  confirm: [reason: string]
}>()

const reason = ref('')
const error = ref<string | null>(null)

watch(() => props.open, (v) => {
  if (v) {
    reason.value = ''
    error.value = null
  }
})

const onConfirm = () => {
  const r = reason.value.trim()
  if (!r) {
    error.value = '請填寫刪除原因'
    return
  }
  emit('confirm', r)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.7)"
  >
    <div class="bg-[var(--bg)] border border-[var(--border)] rounded p-6 max-w-md w-full">
      <h3 class="display-font text-xl mb-2">{{ title }}</h3>
      <p class="text-sm text-[var(--text-dim)] mb-4">{{ message }}</p>

      <textarea
        v-model="reason"
        class="w-full bg-transparent border border-[var(--border)] rounded p-2 text-sm mono"
        rows="3"
        placeholder="例如：違規內容 / 重複上傳 / 日期錯誤"
        :disabled="busy"
      />
      <p v-if="error" class="text-xs text-[var(--accent-2)] mt-1 mono">{{ error }}</p>

      <div class="flex gap-2 justify-end mt-4">
        <button
          type="button"
          class="px-4 py-2 text-sm mono border border-[var(--border)] rounded hover:border-[var(--text-dim)]"
          :disabled="busy"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm mono rounded"
          style="background: var(--accent-2); color: var(--bg)"
          :disabled="busy"
          @click="onConfirm"
        >
          {{ busy ? '處理中…' : '確認刪除' }}
        </button>
      </div>
    </div>
  </div>
</template>
