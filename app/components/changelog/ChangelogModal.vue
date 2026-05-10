<script setup lang="ts">
import type { ChangelogKind } from '#shared/data/changelog'
import { CHANGELOG } from '#shared/data/changelog'

interface Props {
  open: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  confirm: []
}>()

const kindStyle: Record<ChangelogKind, { label: string; color: string }> = {
  feat: { label: 'NEW', color: 'text-[var(--accent)] border-[var(--accent)]' },
  fix: { label: 'FIX', color: 'text-[var(--accent-2)] border-[var(--accent-2)]' },
  perf: { label: 'PERF', color: 'text-[var(--photo)] border-[var(--photo)]' },
  refactor: { label: 'REFACTOR', color: 'text-[var(--text-dim)] border-[var(--text-dim)]' },
  docs: { label: 'DOCS', color: 'text-[var(--text-dim)] border-[var(--text-dim)]' },
  chore: { label: 'CHORE', color: 'text-[var(--text-dim)] border-[var(--text-dim)]' },
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// 防 iOS Safari 背景捲動穿透
watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="changelog">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] bg-black/85 flex items-end sm:items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div
          class="card bg-[var(--surface)] w-full max-w-md max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)]"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <div class="mono text-[0.65rem] text-[var(--accent)] uppercase tracking-wider">
                // CHANGELOG
              </div>
              <h2 class="display-font text-2xl">更新日誌</h2>
            </div>
            <button
              type="button"
              class="text-[var(--text-dim)] text-2xl leading-none hover:text-[var(--text)]"
              aria-label="關閉"
              @click="emit('close')"
            >
              ×
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <article
              v-for="entry in CHANGELOG"
              :key="entry.version"
              class="space-y-3"
            >
              <header class="flex items-baseline justify-between gap-3">
                <h3 class="display-font text-xl">v{{ entry.version }}</h3>
                <span class="mono text-[0.65rem] text-[var(--text-dim)]">{{ entry.date }}</span>
              </header>
              <p v-if="entry.title" class="text-sm text-[var(--text-dim)]">
                {{ entry.title }}
              </p>
              <ul class="space-y-2">
                <li
                  v-for="(item, i) in entry.items"
                  :key="i"
                  class="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <span
                    class="mono text-[0.6rem] uppercase border px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    :class="kindStyle[item.kind].color"
                  >
                    {{ kindStyle[item.kind].label }}
                  </span>
                  <span class="flex-1">{{ item.text }}</span>
                </li>
              </ul>
            </article>
          </div>

          <div class="px-5 py-4 border-t border-[var(--border)]">
            <button
              type="button"
              class="w-full bg-[var(--accent)] text-black mono text-xs uppercase tracking-wider py-3 rounded font-bold hover:opacity-90 transition-opacity"
              @click="emit('confirm')"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.changelog-enter-active,
.changelog-leave-active {
  transition: opacity 0.2s ease;
}
.changelog-enter-active > div,
.changelog-leave-active > div {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.changelog-enter-from,
.changelog-leave-to {
  opacity: 0;
}
.changelog-enter-from > div,
.changelog-leave-to > div {
  transform: translateY(20px);
}
</style>
