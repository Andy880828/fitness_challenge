<script setup lang="ts">
import type { AdminPhotoRow } from '~/composables/useAdminPhotos'
import type { AdminExerciseProofRow } from '~/composables/useAdminExerciseProofs'
import type { ParticipantWithStats } from '#shared/types/participant'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'auth' })
useHead({ title: '照片管理 · 管理中心' })

const adminPhotos = useAdminPhotos()
const adminProofs = useAdminExerciseProofs()
const { list: listParticipants } = useParticipants()

type TabKey = 'food' | 'exercise'
const currentTab = ref<TabKey>('food')

const photos = ref<AdminPhotoRow[]>([])
const proofs = ref<AdminExerciseProofRow[]>([])
const participants = ref<ParticipantWithStats[]>([])
const filterParticipant = ref('')
const filterDate = ref('')
const selected = ref<Set<string>>(new Set())

type LightboxContent = { src?: string | null; text?: string | null }
const lightboxContent = ref<LightboxContent | null>(null)

const modalOpen = ref(false)
const modalMode = ref<'single' | 'batch'>('single')
const modalTargetId = ref<string | null>(null)
const modalBusy = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const currentItems = computed<Array<{ id: string }>>(() =>
  currentTab.value === 'food' ? photos.value : proofs.value,
)

const allSelected = computed(
  () => currentItems.value.length > 0 && selected.value.size === currentItems.value.length,
)

const reload = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    if (currentTab.value === 'food') {
      photos.value = await adminPhotos.list({
        participantId: filterParticipant.value || undefined,
        date: filterDate.value || undefined,
      })
    } else {
      proofs.value = await adminProofs.list({
        participantId: filterParticipant.value || undefined,
        date: filterDate.value || undefined,
      })
    }
    selected.value = new Set()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

const switchTab = async (tab: TabKey) => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  selected.value = new Set()
  errorMsg.value = null
  await reload()
}

const toggleSelect = (id: string) => {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

const toggleSelectAll = () => {
  selected.value = allSelected.value
    ? new Set()
    : new Set(currentItems.value.map(item => item.id))
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
    const api = currentTab.value === 'food' ? adminPhotos : adminProofs
    if (modalMode.value === 'single' && modalTargetId.value) {
      const { error } = await api.remove(modalTargetId.value, reason)
      if (error) throw new Error(error)
    } else {
      const ids = Array.from(selected.value)
      const { data, error } = await api.batchRemove(ids, reason)
      if (error) throw new Error(error)
      if (data && data.failed.length > 0) {
        errorMsg.value = `部分失敗：${data.failed.length} 筆未刪除`
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

const onPreviewPhoto = (photo: AdminPhotoRow) => {
  lightboxContent.value = { src: photo.public_url }
}

const onPreviewProof = (proof: AdminExerciseProofRow) => {
  if (proof.kind === 'photo' && proof.public_url) {
    lightboxContent.value = { src: proof.public_url }
  } else if (proof.kind === 'note' && proof.note) {
    lightboxContent.value = { text: proof.note }
  }
}

const modalTitle = computed(() => {
  const noun = currentTab.value === 'food' ? '飲食照片' : '運動證明'
  if (modalMode.value === 'batch') {
    return `批量刪除 ${selected.value.size} 筆${noun}`
  }
  return `刪除${noun}`
})

onMounted(async () => {
  participants.value = await listParticipants()
  await reload()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div>
        <div class="text-xs text-[var(--accent)] mono mb-2">// ADMIN / MEDIA</div>
        <h1 class="display-font text-2xl md:text-4xl">照片與證明管理</h1>
      </div>
      <NuxtLink to="/admin" class="text-xs mono text-[var(--text-dim)] hover:text-[var(--accent)]">
        ← 回管理中心
      </NuxtLink>
    </div>

    <!-- Tab -->
    <div class="inline-flex rounded border border-[var(--border)] overflow-hidden mb-4">
      <button
        type="button"
        class="px-4 py-2 mono text-xs transition-colors"
        :class="currentTab === 'food'
          ? 'bg-[var(--photo)]/15 text-[var(--photo)]'
          : 'text-[var(--text-dim)] hover:text-[var(--text)]'"
        @click="switchTab('food')"
      >飲食照片</button>
      <button
        type="button"
        class="px-4 py-2 mono text-xs transition-colors border-l border-[var(--border)]"
        :class="currentTab === 'exercise'
          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
          : 'text-[var(--text-dim)] hover:text-[var(--text)]'"
        @click="switchTab('exercise')"
      >運動證明</button>
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
      >
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
        >
        全選 / 取消
      </label>
      <span>共 {{ currentItems.length }} 筆</span>
    </div>

    <p v-if="errorMsg" class="mono text-sm text-[var(--accent-2)] mb-3">{{ errorMsg }}</p>

    <!-- 飲食照片 -->
    <div
      v-if="currentTab === 'food'"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <div v-for="photo in photos" :key="photo.id" class="relative">
        <AdminPhotoCard
          :photo="photo"
          :selected="selected.has(photo.id)"
          @toggle="toggleSelect(photo.id)"
          @preview="onPreviewPhoto(photo)"
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

    <!-- 運動證明 -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <div v-for="proof in proofs" :key="proof.id" class="relative">
        <AdminExerciseProofCard
          :proof="proof"
          :selected="selected.has(proof.id)"
          @toggle="toggleSelect(proof.id)"
          @preview="onPreviewProof(proof)"
        />
        <button
          type="button"
          class="absolute bottom-2 right-2 px-2 py-1 text-xs mono rounded"
          style="background: rgba(0,0,0,0.7); color: var(--accent-2)"
          @click="askDeleteOne(proof.id)"
        >
          刪除
        </button>
      </div>
    </div>

    <p v-if="loading" class="mono text-xs text-[var(--text-dim)] mt-3">載入中…</p>
    <p
      v-else-if="currentItems.length === 0"
      class="mono text-sm text-[var(--text-dim)] mt-6 text-center"
    >
      {{ currentTab === 'food' ? '無飲食照片' : '無運動證明' }}
    </p>

    <Lightbox
      :src="lightboxContent?.src ?? null"
      :text="lightboxContent?.text ?? null"
      @close="lightboxContent = null"
    />

    <DeleteReasonModal
      :open="modalOpen"
      :busy="modalBusy"
      :title="modalTitle"
      @cancel="modalOpen = false"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
