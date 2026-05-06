<script setup lang="ts">
import { TOTAL_DAYS } from '#shared/utils/constants'
import { dayDiff, todayStr } from '#shared/utils/date'
import AuthMenu from './AuthMenu.vue'

const route = useRoute()
const config = useRuntimeConfig()
const { isAuthenticated, isAdmin } = useAuth()

const startDate = config.public.challengeStartDate
const today = todayStr()
const day = computed(() =>
  Math.max(1, Math.min(TOTAL_DAYS, dayDiff(startDate, today) + 1)),
)
const pct = computed(() => Math.min(100, (day.value / TOTAL_DAYS) * 100))

interface NavItem {
  to: string
  label: string
}

const publicNav: readonly NavItem[] = [
  { to: '/leaderboard', label: '排行榜' },
  { to: '/rules', label: '規則' },
]

const authedNav: readonly NavItem[] = [
  { to: '/leaderboard', label: '排行榜' },
  { to: '/checkin', label: '每日打卡' },
  { to: '/dashboard', label: '我的儀表板' },
  { to: '/rules', label: '規則' },
]

const adminNav: readonly NavItem[] = [{ to: '/admin', label: '管理中心' }]

const navItems = computed<readonly NavItem[]>(() => {
  if (!isAuthenticated.value) return publicNav
  return isAdmin.value ? [...authedNav, ...adminNav] : authedNav
})

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <header
    class="border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur"
    style="background: rgba(10, 10, 10, 0.85)"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
      <div class="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <NuxtLink to="/" class="flex items-center gap-3 sm:gap-4">
          <span class="pulse-dot shrink-0" />
          <span class="min-w-0">
            <span class="display-font text-lg sm:text-2xl tracking-wider block">
              減脂增肌 / FORGE
            </span>
            <span class="text-[0.65rem] sm:text-xs text-[var(--text-dim)] mono block">
              DAY {{ day }}/{{ TOTAL_DAYS }}
            </span>
          </span>
        </NuxtLink>

        <div class="flex items-center gap-2 sm:gap-4 flex-wrap">
          <nav class="flex gap-0.5 sm:gap-1 text-xs sm:text-sm flex-wrap" data-testid="main-nav">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-2 sm:px-4 py-2 border-b-2 border-transparent transition-colors hover:text-[var(--accent)]"
              :class="
                isActive(item.to)
                  ? 'text-[var(--accent)] border-b-[var(--accent)]'
                  : 'text-[var(--text-dim)]'
              "
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <AuthMenu />
        </div>
      </div>

      <div class="mt-2 sm:mt-3 progress-bar">
        <div class="progress-fill" :style="{ width: `${pct}%` }" />
      </div>
    </div>
  </header>
</template>
