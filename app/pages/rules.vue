<script setup lang="ts">
import { TOTAL_DAYS, MEASURE_LABELS, SCORE_WEIGHTS } from '#shared/utils/constants'
import { measureDates, formatDateZh } from '#shared/utils/date'

useHead({ title: '規則 · 減脂增肌挑戰賽' })

const { settings } = useChallenge()
const measureDays = computed(() => measureDates(settings.value.startDate))

const fatPct = computed(() => Math.round(SCORE_WEIGHTS.fat * 100))
const musclePct = computed(() => Math.round(SCORE_WEIGHTS.muscle * 100))
const processPct = computed(() => Math.round(SCORE_WEIGHTS.process * 100))
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
      <p class="text-sm text-[var(--text-dim)]">
        運動打卡需附證明：照片或文字（至少 1 筆）。證明本身僅作可信度依據，<strong>不</strong>計入分數。
      </p>
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

    <section class="card p-6 space-y-5">
      <h2 class="display-font text-2xl">計分公式</h2>

      <!-- 總分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// TOTAL</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">總分 = 減脂分 × {{ SCORE_WEIGHTS.fat }}
     + 增肌分 × {{ SCORE_WEIGHTS.muscle }}
     + 過程分 × {{ SCORE_WEIGHTS.process }}</pre>
      </div>

      <!-- 減脂分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// FAT SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">減脂分 = max(0, (初始體脂% − 最新體脂%) / 初始體脂% × 100)</pre>
        <p class="text-sm mt-2 leading-relaxed">
          以「最新一次有效量測」（第 4 / 8 / 12 週中最後一次）對照「初始」。
          體脂下降 <span class="text-[var(--accent)]">1 % 換 1 分</span>，<strong>不封頂</strong>；
          若體脂未降反升（變化為負），記 0 分。
        </p>
      </div>

      <!-- 增肌分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// MUSCLE SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">增肌分 = max(0, (最新肌肉 − 初始肌肉) / 初始肌肉 × 100)</pre>
        <p class="text-sm mt-2 leading-relaxed">
          同樣規則：肌肉增加 1 % 換 1 分，不封頂；若肌肉減少，記 0 分。
        </p>
      </div>

      <!-- 過程分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// PROCESS SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">過程分 = min(100, (運動天數 + 飲食天數 + 飲食照片天數)
                  / (有效天數 × 3)
                  × 100)</pre>
        <ul class="text-sm mt-2 space-y-1 list-disc list-inside leading-relaxed">
          <li>運動天數：勾選「運動」的日數</li>
          <li>飲食天數：勾選「飲食」的日數</li>
          <li>飲食照片天數：上傳飲食照片的「不重複日數」（一日多張仍算 1 天）</li>
          <li>有效天數：自開始日起經過的日數，最多 {{ TOTAL_DAYS }} 天</li>
          <li>
            <span class="text-[var(--text-dim)]">運動證明照片 / 文字</span>
            僅作可信度依據，<strong>不</strong>計入過程分
          </li>
        </ul>
        <p class="text-sm mt-2 text-[var(--text-dim)]">
          每天最多貢獻 3 個 check（運動 / 飲食 / 飲食照片），所以過程分天花板為 100。
        </p>
      </div>

      <!-- 權重 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// WEIGHTS</div>
        <table class="text-sm mono w-full max-w-xs">
          <tbody>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">減脂</td>
              <td class="px-2">×</td>
              <td class="text-[var(--accent)]">{{ fatPct }} %</td>
            </tr>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">增肌</td>
              <td class="px-2">×</td>
              <td class="text-[var(--accent)]">{{ musclePct }} %</td>
            </tr>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">過程</td>
              <td class="px-2">×</td>
              <td class="text-[var(--accent)]">{{ processPct }} %</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-[var(--text-dim)] mono">
        程式實作見 shared/utils/score.ts；本頁公式與實作 1:1 對映，無額外封頂或安全護欄。
      </p>
    </section>

    <section v-if="settings.testMode" class="card p-6 border-[var(--accent-2)]">
      <Badge variant="warn">TEST MODE</Badge>
      <p class="mt-2 text-sm">目前處於測試模式：日期限制已解除。</p>
    </section>
  </div>
</template>
