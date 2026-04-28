<script setup lang="ts">
import { TOTAL_DAYS } from '#shared/utils/constants'
import { dayDiff, todayStr } from '#shared/utils/date'

const route = useRoute()
const config = useRuntimeConfig()

const startDate = config.public.challengeStartDate
const today = todayStr()
const day = computed(() =>
  Math.max(1, Math.min(TOTAL_DAYS, dayDiff(startDate, today) + 1)),
)
const pct = computed(() => Math.min(100, (day.value / TOTAL_DAYS) * 100))

const navItems = [
  { to: '/leaderboard', label: '排行榜' },
  { to: '/checkin', label: '每日打卡' },
  { to: '/dashboard', label: '我的儀表板' },
  { to: '/register', label: '報名' },
  { to: '/rules', label: '規則' },
] as const

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <header
    class="border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur"
    style="background: rgba(10, 10, 10, 0.85)"
  >
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <NuxtLink to="/" class="flex items-center gap-4">
          <span class="pulse-dot" />
          <span>
            <span class="display-font text-2xl tracking-wider block">
              減脂增肌 / FORGE
            </span>
            <span class="text-xs text-[var(--text-dim)] mono block">
              12-WEEK CHALLENGE · DAY {{ day }}/{{ TOTAL_DAYS }}
            </span>
          </span>
        </NuxtLink>

        <nav class="flex gap-1 text-sm flex-wrap">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-4 py-2 border-b-2 border-transparent transition-colors hover:text-[var(--accent)]"
            :class="
              isActive(item.to)
                ? 'text-[var(--accent)] border-b-[var(--accent)]'
                : 'text-[var(--text-dim)]'
            "
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="mt-3 progress-bar">
        <div class="progress-fill" :style="{ width: `${pct}%` }" />
      </div>
    </div>
  </header>
</template>
