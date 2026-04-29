<script setup lang="ts">
const { user, isAuthenticated, signOut } = useAuth()

const displayName = computed(() => {
  const email = user.value?.email
  if (!email) return ''
  return email.split('@')[0] ?? email
})

const onLogout = async () => {
  const { error } = await signOut()
  if (error) {
    console.warn('logout failed', error)
    return
  }
  await navigateTo('/leaderboard')
}
</script>

<template>
  <div class="flex items-center gap-2 text-xs mono">
    <template v-if="isAuthenticated">
      <span class="text-[var(--text-dim)] hidden sm:inline" data-testid="auth-user">
        {{ displayName }}
      </span>
      <button
        type="button"
        class="btn-ghost px-3 py-2 rounded"
        data-testid="auth-logout"
        @click="onLogout"
      >
        登出
      </button>
    </template>
    <template v-else>
      <NuxtLink
        to="/login"
        class="btn-ghost px-3 py-2 rounded"
        data-testid="auth-login"
      >
        登入
      </NuxtLink>
      <NuxtLink
        to="/register"
        class="btn-primary px-3 py-2 rounded"
        data-testid="auth-register"
      >
        報名
      </NuxtLink>
    </template>
  </div>
</template>
