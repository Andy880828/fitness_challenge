<script setup lang="ts">
import { TOTAL_DAYS } from '#shared/utils/constants'
import { addDays, formatDateZh } from '#shared/utils/date'

const config = useRuntimeConfig()
const startDate = config.public.challengeStartDate
const endDate = addDays(startDate, TOTAL_DAYS - 1)
</script>

<template>
  <footer class="border-t border-[var(--border)] mt-20 py-8 text-center text-xs text-[var(--text-dim)] mono">
    FORGE · 12-WEEK CHALLENGE · {{ formatDateZh(startDate) }} — {{ formatDateZh(endDate) }} ·
    資料儲存於 Supabase 雲端
  </footer>
</template>
