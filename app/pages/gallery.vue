<script setup lang="ts">
import type { PhotoWithOwner } from '#shared/types/photo'
import type { ParticipantProgress } from '~/composables/useGallery'

definePageMeta({ middleware: 'auth', layout: 'default' })
useHead({ title: '社群進度 · 減脂增肌挑戰賽' })

const { listRecentPhotos, listAllProgress } = useGallery()

const PAGE_SIZE = 60
const photos = ref<PhotoWithOwner[]>([])
const progress = ref<ParticipantProgress[]>([])
const lightboxSrc = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)

const sortedProgress = computed(() => {
  return [...progress.value].sort((a, b) => {
    const aDelta = a.weightDelta ?? 0
    const bDelta = b.weightDelta ?? 0
    return aDelta - bDelta
  })
})

const initialLoad = async () => {
  loading.value = true
  const [p, prog] = await Promise.all([
    listRecentPhotos(PAGE_SIZE, 0),
    listAllProgress(),
  ])
  photos.value = p
  progress.value = prog
  hasMore.value = p.length === PAGE_SIZE
  loading.value = false
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  const next = await listRecentPhotos(PAGE_SIZE, photos.value.length)
  photos.value = [...photos.value, ...next]
  hasMore.value = next.length === PAGE_SIZE
  loadingMore.value = false
}

onMounted(initialLoad)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="text-xs text-[var(--accent)] mono mb-2">// COMMUNITY</div>
    <h1 class="display-font text-3xl md:text-4xl mb-6">社群進度</h1>

    <div v-if="loading" class="mono text-sm text-[var(--text-dim)]">載入中…</div>

    <template v-else>
      <section class="mb-10">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="display-font text-xl md:text-2xl">最新動態</h2>
          <span class="mono text-[0.65rem] text-[var(--text-dim)]">
            {{ photos.length }} 張
          </span>
        </div>
        <div
          v-if="photos.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
        >
          <PhotoFeedTile
            v-for="p in photos"
            :key="p.id"
            :photo="p"
            @open="(src: string) => (lightboxSrc = src)"
          />
        </div>
        <p v-else class="mono text-sm text-[var(--text-dim)]">還沒有人上傳照片</p>

        <div v-if="hasMore" class="mt-6 text-center">
          <button
            class="btn-ghost px-6 py-2 rounded mono text-xs"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? '載入中…' : '載入更多' }}
          </button>
        </div>
      </section>

      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="display-font text-xl md:text-2xl">參賽者進度</h2>
          <span class="mono text-[0.65rem] text-[var(--text-dim)]">
            依體重變化排序
          </span>
        </div>
        <div
          v-if="sortedProgress.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          <ParticipantProgressCard
            v-for="row in sortedProgress"
            :key="row.id"
            :progress="row"
          />
        </div>
        <p v-else class="mono text-sm text-[var(--text-dim)]">還沒有報名資料</p>
      </section>
    </template>

    <Lightbox :src="lightboxSrc" @close="lightboxSrc = null" />
  </div>
</template>
