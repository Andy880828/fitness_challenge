<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppFooter from '~/components/layout/AppFooter.vue'

const { participant, loading, error, reload } = provideParticipantContext()

onMounted(reload)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <div v-if="loading && !participant" class="max-w-3xl mx-auto px-6 py-20 text-center">
        <p class="mono text-sm text-[var(--text-dim)]">載入中...</p>
      </div>

      <div
        v-else-if="error && !participant"
        class="max-w-3xl mx-auto px-6 py-20 text-center"
        data-testid="auth-error"
      >
        <p class="mono text-sm text-[var(--accent-2)] mb-4">{{ error }}</p>
        <NuxtLink to="/register" class="btn-primary inline-block px-6 py-3 rounded mono">
          前往報名
        </NuxtLink>
      </div>

      <slot v-else />
    </main>
    <AppFooter />
  </div>
</template>
