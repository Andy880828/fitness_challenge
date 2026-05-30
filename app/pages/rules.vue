<script setup lang="ts">
import {
  TOTAL_DAYS,
  MEASURE_LABELS,
  SCORE_WEIGHTS,
  SCORE_CONST,
  PROCESS_TOTAL_CHECKS,
} from '#shared/utils/constants'
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
      <div class="text-xs text-[var(--accent)] mono mb-2">// RULES & SCORING v2.0</div>
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
      <p class="text-sm text-[var(--text-dim)]">
        計分只用「初始」與「結算」兩筆；第 4 / 8 週為階段更新。活動進行中以「目前最新一筆」即時顯示排名。
      </p>
    </section>

    <section class="card p-6 space-y-5">
      <h2 class="display-font text-2xl">計分公式</h2>

      <p class="text-sm leading-relaxed">
        我們用「<strong>相對變化率 × 難度係數</strong>」計分，不單純比掉幾公斤。原因很簡單：體脂越低、肌肉越多的人，要再減脂增肌在生理上就是更難，每一個百分點的成本不一樣。所以系統會依你<strong>初始 InBody 數據</strong>自動算出你的難度係數，讓不同起點的人能公平地在同一個榜上比。
      </p>

      <!-- 常數表 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// CONSTANTS</div>
        <table class="text-sm mono w-full max-w-md">
          <thead>
            <tr class="text-[var(--text-dim)]">
              <th class="text-left py-1">參數</th>
              <th class="text-right">男</th>
              <th class="text-right">女</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">參考體脂 F_REF</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.M.F_REF }}</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.F.F_REF }}</td>
            </tr>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">減脂封頂 FAT_CAP</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.M.FAT_CAP }}</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.F.FAT_CAP }}</td>
            </tr>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">增肌封頂 MUS_CAP</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.M.MUS_CAP }}</td>
              <td class="text-right text-[var(--accent)]">{{ SCORE_CONST.F.MUS_CAP }}</td>
            </tr>
            <tr>
              <td class="py-1 text-[var(--text-dim)]">同性別平均肌肉 AVG_SMM</td>
              <td colspan="2" class="text-right text-[var(--text-dim)]">該性別所有參賽者「初始骨骼肌量」平均（動態）</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 總分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// TOTAL (max 100)</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">總分 = 減脂分 + 增肌分 + 過程分
     = fatNorm × {{ SCORE_WEIGHTS.fat }} (max 40)
     + musNorm × {{ SCORE_WEIGHTS.muscle }} (max 40)
     + procNorm × {{ SCORE_WEIGHTS.process }} (max 20)</pre>
      </div>

      <!-- 減脂分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// FAT SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">rawFatLoss  = (bf0 - bf1) / bf0 × 100
fatCoef     = F_REF / bf0
weightedFat = max(0, rawFatLoss) × fatCoef
fatNorm     = min(100, weightedFat / FAT_CAP × 100)</pre>
        <p class="text-sm mt-2 leading-relaxed">
          體脂越低 → fatCoef 越大 → 每 1% 減脂值更多分。負成績歸零（不倒扣）；加權後 ≥ {{ SCORE_CONST.M.FAT_CAP }} 即拿滿 40。
        </p>
      </div>

      <!-- 增肌分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// MUSCLE SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">rawMusGain  = (sm1 - sm0) / sm0 × 100
musCoef     = sm0 / AVG_SMM   // 線性，不開根號
weightedMus = max(0, rawMusGain) × musCoef
musNorm     = min(100, weightedMus / MUS_CAP × 100)</pre>
        <p class="text-sm mt-2 leading-relaxed">
          初始肌肉越多 → musCoef 越大 → 每 1% 增肌值更多分。加權後 ≥ {{ SCORE_CONST.M.MUS_CAP }} 即拿滿 40。
          <span class="text-[var(--text-dim)]">AVG_SMM 在報名期間會跟著名單動態調整。</span>
        </p>
      </div>

      <!-- 過程分 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// PROCESS SCORE</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">procNorm = min(100, checks / ({{ TOTAL_DAYS }} × 3) × 100)
         = min(100, checks / {{ PROCESS_TOTAL_CHECKS }} × 100)</pre>
        <ul class="text-sm mt-2 space-y-1 list-disc list-inside leading-relaxed">
          <li>運動 / 飲食 / 飲食照片，每天最多 3 個勾，84 天滿分 = {{ PROCESS_TOTAL_CHECKS }} 勾</li>
          <li>活動進行中以「已過天數 × 3」為即時分母，活動結束時等價於 {{ PROCESS_TOTAL_CHECKS }}</li>
          <li>
            <span class="text-[var(--text-dim)]">運動證明照片 / 文字</span>
            僅作可信度依據，<strong>不</strong>計入過程分
          </li>
        </ul>
      </div>

      <!-- 範例 -->
      <div>
        <div class="mono text-xs text-[var(--accent)] mb-1">// EXAMPLE — 男 B</div>
        <pre class="bg-[var(--surface-2)] rounded p-3 mono text-xs overflow-x-auto leading-relaxed">起點：bf0=13.1%, sm0=43.1kg；結束：bf1=11.8%, sm1=43.5kg
出勤率 90% → procScore = 18

rawFatLoss = (13.1-11.8)/13.1 × 100 = 9.92
fatCoef    = 28/13.1               = 2.14
weightedFat= 9.92 × 2.14            = 21.21
fatNorm    = min(100, 21.21/25×100) = 84.85   → fatScore = 33.94

rawMusGain = (43.5-43.1)/43.1 × 100 = 0.93
musCoef    = 43.1/33.88             = 1.27
weightedMus= 0.93 × 1.27             = 1.18
musNorm    = min(100, 1.18/8×100)   = 14.76   → musScore = 5.90

composite  = 33.94 + 5.90 + 18      = 57.84</pre>
        <p class="text-sm mt-2 text-[var(--text-dim)]">
          減幅雖小（體脂只少 1.3 個百分點），但因為起點已低，加權後仍能拿到接近 34 / 40 的減脂分。
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
        程式實作見 shared/utils/score.ts；本頁公式與實作 1:1 對映。
      </p>
    </section>

    <section class="card p-6 space-y-2">
      <h2 class="display-font text-2xl">邊界與異常處理</h2>
      <ul class="text-sm space-y-1 list-disc list-inside leading-relaxed">
        <li>未填初始量測 → 無法計分，分數顯示 0（過程分仍可累積）</li>
        <li>未到結算日 → 用「目前最新一筆」當 bf1 / sm1 顯示即時排名</li>
        <li>體脂上升 / 肌肉減少 → max(0, …) 已歸零，不倒扣</li>
        <li>所有歸一化都有 min(100, …) 封頂，總分上限 100</li>
      </ul>
    </section>

    <section v-if="settings.testMode" class="card p-6 border-[var(--accent-2)]">
      <Badge variant="warn">TEST MODE</Badge>
      <p class="mt-2 text-sm">目前處於測試模式：日期限制已解除。</p>
    </section>
  </div>
</template>
