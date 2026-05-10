<script setup lang="ts">
import ChangelogModal from './ChangelogModal.vue'

const { hasUnread, syncFromStorage, markRead, latestVersion } = useChangelog()
const open = ref(false)

onMounted(() => {
  syncFromStorage()
})

const onOpen = () => {
  open.value = true
}

const onClose = () => {
  open.value = false
}

const onConfirm = () => {
  markRead()
  open.value = false
}
</script>

<template>
  <button
    type="button"
    class="fixed bottom-4 right-4 z-[150] w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg flex items-center justify-center text-xl hover:border-[var(--accent)] hover:scale-105 transition-all"
    :title="`更新日誌 (v${latestVersion})`"
    aria-label="更新日誌"
    @click="onOpen"
  >
    <span aria-hidden="true">📜</span>
    <span
      v-if="hasUnread"
      class="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-[var(--accent-2)] text-white mono text-[0.55rem] font-bold flex items-center justify-center"
    >
      NEW
    </span>
  </button>

  <ChangelogModal :open="open" @close="onClose" @confirm="onConfirm" />
</template>
