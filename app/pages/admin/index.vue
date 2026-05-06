<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'], layout: 'auth' })
useHead({ title: '管理中心 · 減脂增肌挑戰賽' })
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
    <div class="mb-8">
      <div class="text-xs text-[var(--accent)] mono mb-2">// ADMIN CONSOLE</div>
      <h1 class="display-font text-3xl md:text-5xl">管理中心</h1>
      <p class="text-sm text-[var(--text-dim)] mt-2">所有操作將寫入稽核軌跡。</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <NuxtLink
        to="/admin/checkins"
        class="block p-6 border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
      >
        <div class="text-xs mono text-[var(--accent)] mb-2">// CHECKINS</div>
        <h2 class="display-font text-xl mb-2">打卡管理</h2>
        <p class="text-sm text-[var(--text-dim)]">檢視 / 修改參賽者打卡並標記已審核。</p>
      </NuxtLink>

      <NuxtLink
        to="/admin/photos"
        class="block p-6 border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
      >
        <div class="text-xs mono text-[var(--accent)] mb-2">// PHOTOS</div>
        <h2 class="display-font text-xl mb-2">照片管理</h2>
        <p class="text-sm text-[var(--text-dim)]">依參賽者 / 日期篩選，可批量刪除。</p>
      </NuxtLink>
    </div>
  </div>
</template>
