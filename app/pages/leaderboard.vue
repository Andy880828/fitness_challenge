<script setup lang="ts">
import type { Gender } from '#shared/types/participant'

useHead({ title: '排行榜 · 減脂增肌挑戰賽' })

const { list } = useParticipants()
const filter = ref<Gender | 'ALL'>('ALL')

const { data: participants } = await useAsyncData('leaderboard', () => list())
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
    <div class="text-xs text-[var(--accent)] mono mb-2">// LIVE LEADERBOARD</div>
    <h1 class="display-font text-3xl md:text-5xl mb-2">即時排行榜</h1>
    <p class="text-sm text-[var(--text-dim)] mt-2 mb-6">
      綜合分數滿分 100 · 男女組各取一位綜合冠軍
    </p>
    <LeaderboardTabs v-model="filter" />
    <LeaderboardTable :participants="participants ?? []" :filter="filter" />
  </div>
</template>
