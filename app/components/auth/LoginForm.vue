<script setup lang="ts">
const route = useRoute()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const onSubmit = async () => {
  error.value = null
  loading.value = true
  const res = await signIn(email.value.trim(), password.value)
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  const redirect = (route.query.redirect as string) || '/dashboard'
  await navigateTo(redirect)
}
</script>

<template>
  <form class="card p-6 space-y-4" @submit.prevent="onSubmit">
    <div>
      <label class="label">Email</label>
      <input
        v-model="email"
        type="email"
        class="input"
        autocomplete="email"
        required
      >
    </div>
    <div>
      <label class="label">密碼</label>
      <input
        v-model="password"
        type="password"
        class="input"
        autocomplete="current-password"
        required
      >
    </div>
    <p v-if="error" class="mono text-xs text-[var(--accent-2)]">
      {{ error }}
    </p>
    <button
      type="submit"
      class="btn-primary w-full py-3 rounded mono"
      :class="{ 'btn-loading': loading }"
      :disabled="loading"
    >
      {{ loading ? '登入中...' : 'LOG IN' }}
    </button>
    <div class="text-center text-xs text-[var(--text-dim)]">
      還沒帳號？
      <NuxtLink to="/register" class="text-[var(--accent)] hover:underline">前往報名</NuxtLink>
    </div>
  </form>
</template>
