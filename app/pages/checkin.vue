<script setup lang="ts">
import { todayStr } from '#shared/utils/date'
import type { UploadStage } from '~/components/checkin/PhotoUploadButton.vue'

definePageMeta({ middleware: 'auth', layout: 'auth' })
useHead({ title: '每日打卡 · 減脂增肌挑戰賽' })

const { participant } = useParticipantContext()
const { listRange, toggle } = useCheckins()
const { listByParticipant, upload, remove } = usePhotos()
const { settings } = useChallenge()

const selectedDate = ref<string>(todayStr())
const todayIso = computed(() => todayStr())
const isFutureSelected = computed(() => selectedDate.value > todayIso.value)
const checkinsMap = ref<Record<string, { workout: boolean; diet: boolean }>>({})
const photosMap = ref<Record<string, Awaited<ReturnType<typeof listByParticipant>>[string]>>({})
const lightboxSrc = ref<string | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)
const uploadStage = ref<UploadStage>('idle')
const uploadProgress = ref(0)

const today = new Date(selectedDate.value)
const year = ref(today.getUTCFullYear())
const month = ref(today.getUTCMonth() + 1)

const reload = async () => {
  if (!participant.value) return
  const fromDate = `${year.value}-${String(month.value).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year.value, month.value, 0)).getUTCDate()
  const toDate = `${year.value}-${String(month.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const [c, p] = await Promise.all([
    listRange(participant.value.id, fromDate, toDate),
    listByParticipant(participant.value.id),
  ])
  checkinsMap.value = c
  photosMap.value = p
}

watch(participant, (p) => {
  if (p) reload()
}, { immediate: true })

watch([year, month], reload)

const todaysState = computed(() => checkinsMap.value[selectedDate.value] ?? { workout: false, diet: false })
const todaysPhotos = computed(() => photosMap.value[selectedDate.value] ?? [])

const onToggle = async (field: 'workout' | 'diet') => {
  if (!participant.value || busy.value) return
  busy.value = true
  const next = !todaysState.value[field]
  const prev = checkinsMap.value
  checkinsMap.value = {
    ...prev,
    [selectedDate.value]: { ...todaysState.value, [field]: next },
  }
  const res = await toggle(participant.value.id, selectedDate.value, field, next, todaysState.value)
  if (res.error) {
    checkinsMap.value = prev
    error.value = res.error
  }
  busy.value = false
}

const onPhotoSelect = async (file: File) => {
  if (!participant.value) return
  busy.value = true
  error.value = null
  uploadStage.value = 'compressing'
  uploadProgress.value = 0
  const res = await upload(participant.value.id, selectedDate.value, file, {
    onCompressProgress: (pct) => {
      uploadProgress.value = pct
    },
    onUploadProgress: (pct) => {
      if (uploadStage.value !== 'uploading') uploadStage.value = 'uploading'
      uploadProgress.value = pct
    },
  })
  if (res.error) {
    error.value = res.error
  } else if (res.data) {
    const list = photosMap.value[selectedDate.value] ?? []
    photosMap.value = { ...photosMap.value, [selectedDate.value]: [res.data, ...list] }
  }
  uploadStage.value = 'idle'
  uploadProgress.value = 0
  busy.value = false
}

const onPhotoDelete = async (id: string) => {
  busy.value = true
  const res = await remove(id)
  if (res.error) {
    error.value = res.error
  } else {
    const list = (photosMap.value[selectedDate.value] ?? []).filter(p => p.id !== id)
    photosMap.value = { ...photosMap.value, [selectedDate.value]: list }
  }
  busy.value = false
}

const prevMonth = () => {
  if (month.value === 1) {
    month.value = 12
    year.value -= 1
  } else {
    month.value -= 1
  }
}
const nextMonth = () => {
  if (month.value === 12) {
    month.value = 1
    year.value += 1
  } else {
    month.value += 1
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="text-xs text-[var(--accent)] mono mb-2">// CHECK-IN</div>
    <h1 class="display-font text-3xl md:text-4xl mb-6">每日打卡</h1>

    <p v-if="error" class="mono text-sm text-[var(--accent-2)] mb-4">{{ error }}</p>

    <div v-if="participant" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <button class="btn-ghost px-3 py-1 rounded text-xs" @click="prevMonth">←</button>
          <div class="display-font text-2xl">{{ year }} / {{ month }}</div>
          <button class="btn-ghost px-3 py-1 rounded text-xs" @click="nextMonth">→</button>
        </div>
        <MonthCalendar
          :year="year"
          :month="month"
          :checkins="checkinsMap"
          :photos="photosMap"
          :start-date="settings.startDate"
          :selected="selectedDate"
          @select="(d: string) => (selectedDate = d)"
        />
      </div>

      <div class="space-y-4">
        <div class="card p-4">
          <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mb-2">
            選擇日期
          </div>
          <input v-model="selectedDate" type="date" class="input" :max="todayIso">
          <p v-if="isFutureSelected" class="mono text-[0.65rem] text-[var(--accent-2)] mt-2">
            無法打未來的卡
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <CheckinTile
            label="運動"
            variant="workout"
            :active="todaysState.workout"
            :disabled="busy || isFutureSelected"
            @toggle="onToggle('workout')"
          />
          <CheckinTile
            label="飲食"
            variant="diet"
            :active="todaysState.diet"
            :disabled="busy || isFutureSelected"
            @toggle="onToggle('diet')"
          />
        </div>

        <div>
          <div class="mono text-[0.65rem] uppercase tracking-wider text-[var(--text-dim)] mb-2">
            飲食照片
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <PhotoUploadButton
              :disabled="busy || isFutureSelected"
              :stage="uploadStage"
              :progress="uploadProgress"
              @select="onPhotoSelect"
            />
            <div
              v-for="p in todaysPhotos"
              :key="p.id"
              class="relative aspect-square overflow-hidden rounded border border-[var(--border)] group"
            >
              <button type="button" class="w-full h-full" @click="lightboxSrc = p.publicUrl">
                <img :src="p.publicUrl" :alt="p.date" class="w-full h-full object-cover">
              </button>
              <button
                type="button"
                class="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center"
                @click.stop="onPhotoDelete(p.id)"
              >×</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Lightbox :src="lightboxSrc" @close="lightboxSrc = null" />
  </div>
</template>
