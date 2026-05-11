<script setup lang="ts">
import { TOTAL_DAYS, MEASURE_LABELS, SCORE_WEIGHTS } from '#shared/utils/constants'
import { measureDates, formatDateZh } from '#shared/utils/date'

useHead({ title: '規則 · 減脂增肌挑戰賽' })

const { settings } = useChallenge()
const measureDays = computed(() => measureDates(settings.value.startDate))
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6">
    <div>
      <div class="text-xs text-[var(--accent)] mono mb-2">// RULES & SCORING</div>
      <h1 class="display-font text-3xl md:text-5xl">活動規則</h1>
    </div>

    <section class="card p-6 space-y-3">
      <h2 class="display-font text-2xl">活動期間</h2>
      <p>共 {{ TOTAL_DAYS }} 天，自 <span class="mono text-[var(--accent)]">{{ formatDateZh(settings.startDate) }}</span> 起算。</p>
      <p>每日可打卡：運動 / 飲食 / 上傳飲食照片（三項各算 1 次過程分）。</p>
    </section>

    <section class="card p-6 space-y-3">
      <h2 class="display-font text-2xl">量測時點（4 次 InBody）</h2>
      <ul class="space-y-1 mono text-sm">
        <li v-for="(label, i) in MEASURE_LABELS" :key="i">
          <span class="text-[var(--text-dim)]">{{ label }}：</span>
          <span class="text-[var(--accent)]">{{ formatDateZh(measureDays[i] ?? '') }}</span>
        </li>
      </ul>
    </section>

    <section class="card p-6 space-y-3">
      <h2 class="display-font text-2xl">計分公式</h2>
      <p class="text-sm text-[var(--text-dim)]">
        綜合分 = 減脂 × {{ SCORE_WEIGHTS.fat * 100 }}% + 增肌 × {{ SCORE_WEIGHTS.muscle * 100 }}% + 過程 × {{ SCORE_WEIGHTS.process * 100 }}%
      </p>
      <ul class="text-sm space-y-1">
        <li>· 減脂：(初始體脂% − 最新體脂%) / 初始 × 100（直接作為分數，不封頂）</li>
        <li>· 增肌：(最新肌肉 − 初始肌肉) / 初始 × 100（直接作為分數，不封頂）</li>
        <li>· 過程：總打卡 / (有效天數 × 3) × 100，封頂 100</li>
      </ul>
      <p class="text-xs text-[var(--text-dim)] mono">
        分數真實反映變化幅度，無上下限保護；極端目標由活動規範本身約束。
      </p>
    </section>

    <section v-if="settings.testMode" class="card p-6 border-[var(--accent-2)]">
      <Badge variant="warn">TEST MODE</Badge>
      <p class="mt-2 text-sm">目前處於測試模式：日期限制已解除。</p>
    </section>
  </div>
</template>
