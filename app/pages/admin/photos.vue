<script setup lang="ts">
import type { AdminPhotoRow } from '~/composables/useAdminPhotos'
import type { ParticipantWithStats } from '#shared/types/participant'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'auth' })
useHead({ title: '照片管理 · 管理中心' })

const { list, remove, batchRemove } = useAdminPhotos()
const { list: listParticipants } = useParticipants()

const photos = ref<AdminPhotoRow[]>([])
const participants = ref<ParticipantWithStats[]>([])
const filterParticipant = ref('')
const filterDate = ref('')
const selected = ref<Set<string>>(new Set())
const previewSrc = ref<string | null>(null)
const modalOpen = ref(false)
const modalMode = ref<'single' | 'batch'>('single')
const modalTargetId = ref<string | null>(null)
const modalBusy = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const allSelected = computed(() => photos.value.length > 0 && selected.value.size === photos.value.length)

const reload = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    photos.value = await list({
      participantId: filterParticipant.value || undefined,
      date: filterDate.value || undefined,
    })
    selected.value = new Set()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

const toggleSelect = (id: string) => {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

const toggleSelectAll = () => {
  selected.value = allSelected.value ? new Set() : new Set(photos.value.map((p) => p.id))
}

const askDeleteOne = (id: string) => {
  modalMode.value = 'single'
  modalTargetId.value = id
  modalOpen.value = true
}

const askDeleteBatch = () => {
  if (selected.value.size === 0) return
  modalMode.value = 'batch'
  modalTargetId.value = null
  modalOpen.value = true
}

const onConfirmDelete = async (reason: string) => {
  modalBusy.value = true
  errorMsg.value = null
  try {
    if (modalMode.value === 'single' && modalTargetId.value) {
      const { error } = await remove(modalTargetId.value, reason)
      if (error) throw new Error(error)
    } else {
      const ids = Array.from(selected.value)
      const { data, error } = await batchRemove(ids, reason)
      if (error) throw new Error(error)
      if (data && data.failed.length > 0) {
        errorMsg.value = `部分失敗：${data.failed.length} 張未刪除`
      }
    }
    modalOpen.value = false
    await reload()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '刪除失敗'
  } finally {
    modalBusy.value = false
  }
}

onMounted(async () => {
  participants.value = await listParticipants()
  await reload()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div>
        <div class="text-xs text-[var(--accent)] mono mb-2">// ADMIN / PHOTOS</div>
        <h1 class="display-font text-2xl md:text-4xl">照片管理</h1>
      </div>
      <NuxtLink to="/admin" class="text-xs mono text-[var(--text-dim)] hover:text-[var(--accent)]">
        ← 回管理中心
      </NuxtLink>
    </div>

    <div class="grid gap-3 md:grid-cols-4 mb-4 p-3 border border-[var(--border)] rounded">
      <select
        v-model="filterParticipant"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
      >
        <option value="">全部參賽者</option>
        <option v-for="p in participants" :key="p.id" :value="p.id">
          {{ p.name }} ({{ p.gender }})
        </option>
      </select>
      <input
        v-model="filterDate"
        type="date"
        class="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm"
      />
      <button
        type="button"
        class="px-3 py-1 text-sm mono rounded"
        style="background: var(--accent); color: var(--bg)"
        @click="reload"
      >
        套用篩選
      </button>
      <button
        type="button"
        class="px-3 py-1 text-sm mono rounded"
        style="background: var(--accent-2); color: var(--bg)"
        :disabled="selected.size === 0"
        :class="{ 'opacity-50 cursor-not-allowed': selected.size === 0 }"
        @click="askDeleteBatch"
      >
        批量刪除（{{ selected.size }}）
      </button>
    </div>

    <div class="flex items-center gap-3 mb-3 text-xs mono text-[var(--text-dim)]">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="allSelected"
          class="w-4 h-4 cursor-pointer"
          @change="toggleSelectAll"
        />
        全選 / 取消
      </label>
      <span>共 {{ photos.length }} 張</span>
    </div>

    <p v-if="errorMsg" class="mono text-sm text-[var(--accent-2)] mb-3">{{ errorMsg }}</p>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="photo in photos" :key="photo.id" class="relative">
        <AdminPhotoCard
          :photo="photo"
          :selected="selected.has(photo.id)"
          @toggle="toggleSelect(photo.id)"
          @preview="previewSrc = photo.public_url"
        />
        <button
          type="button"
          class="absolute bottom-2 right-2 px-2 py-1 text-xs mono rounded"
          style="background: rgba(0,0,0,0.7); color: var(--accent-2)"
          @click="askDeleteOne(photo.id)"
        >
          刪除
        </button>
      </div>
    </div>

    <p v-if="loading" class="mono text-xs text-[var(--text-dim)] mt-3">載入中…</p>
    <p v-else-if="photos.length === 0" class="mono text-sm text-[var(--text-dim)] mt-6 text-center">
      無照片
    </p>

    <Lightbox :src="previewSrc" @close="previewSrc = null" />

    <DeleteReasonModal
      :open="modalOpen"
      :busy="modalBusy"
      :title="modalMode === 'batch' ? `批量刪除 ${selected.size} 張照片` : '刪除照片'"
      @cancel="modalOpen = false"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
