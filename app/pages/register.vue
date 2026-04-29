<script setup lang="ts">
useHead({ title: '報名 · 減脂增肌挑戰賽' })
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
    <div class="text-xs text-[var(--accent)] mono mb-2">// REGISTRATION</div>
    <h1 class="display-font text-3xl md:text-5xl mb-2">加入挑戰</h1>
    <p class="text-[var(--text-dim)] mb-6">填寫初始量測（5/6 InBody 數據）即可開始打卡。</p>
    <RegisterForm />
  </div>
</template>
