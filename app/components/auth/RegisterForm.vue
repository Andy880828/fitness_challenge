<script setup lang="ts">
import type { Gender } from '#shared/types/participant'

const { register } = useAuth()

const email = ref('')
const password = ref('')
const name = ref('')
const gender = ref<Gender>('M')
const age = ref<number | null>(null)
const height = ref<number | null>(null)
const weight = ref<number | null>(null)
const fatPct = ref<number | null>(null)
const muscle = ref<number | null>(null)

const error = ref<string | null>(null)
const loading = ref(false)

const isValid = computed(
  () =>
    email.value.includes('@') &&
    password.value.length >= 6 &&
    name.value.trim().length > 0 &&
    typeof weight.value === 'number' &&
    typeof fatPct.value === 'number' &&
    typeof muscle.value === 'number',
)

const onSubmit = async () => {
  if (!isValid.value || weight.value == null || fatPct.value == null || muscle.value == null) {
    error.value = '請完整填寫所有必填欄位'
    return
  }
  error.value = null
  loading.value = true
  const res = await register({
    email: email.value.trim(),
    password: password.value,
    participant: {
      name: name.value.trim(),
      gender: gender.value,
      age: age.value,
      height: height.value,
      startWeight: weight.value,
    },
    startMeasure: {
      weight: weight.value,
      fatPct: fatPct.value,
      muscle: muscle.value,
    },
  })
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  await navigateTo('/dashboard')
}
</script>

<template>
  <form class="card p-6 space-y-5" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Email *</label>
        <input v-model="email" type="email" class="input" autocomplete="email" required>
      </div>
      <div>
        <label class="label">密碼 (≥ 6 字元) *</label>
        <input
          v-model="password"
          type="password"
          class="input"
          autocomplete="new-password"
          minlength="6"
          required
        >
      </div>
      <div>
        <label class="label">姓名 *</label>
        <input v-model="name" type="text" class="input" required>
      </div>
      <div>
        <label class="label">性別 *</label>
        <select v-model="gender" class="select">
          <option value="M">男</option>
          <option value="F">女</option>
        </select>
      </div>
      <div>
        <label class="label">年齡</label>
        <input v-model.number="age" type="number" class="input" min="0">
      </div>
      <div>
        <label class="label">身高 (cm)</label>
        <input v-model.number="height" type="number" class="input" min="0" step="0.1">
      </div>
    </div>

    <div class="border-t border-[var(--border)] pt-4">
      <div class="text-xs text-[var(--accent)] mono mb-2">// 初始 InBody (5/6)</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="label">體重 kg *</label>
          <input v-model.number="weight" type="number" class="input" step="0.1" required>
        </div>
        <div>
          <label class="label">體脂 % *</label>
          <input v-model.number="fatPct" type="number" class="input" step="0.1" required>
        </div>
        <div>
          <label class="label">肌肉 kg *</label>
          <input v-model.number="muscle" type="number" class="input" step="0.1" required>
        </div>
      </div>
    </div>

    <p v-if="error" class="mono text-xs text-[var(--accent-2)]">{{ error }}</p>

    <button
      type="submit"
      class="btn-primary w-full py-3 rounded mono"
      :class="{ 'btn-loading': loading }"
      :disabled="!isValid || loading"
    >
      {{ loading ? '建立中...' : 'JOIN CHALLENGE' }}
    </button>
    <div class="text-center text-xs text-[var(--text-dim)]">
      已有帳號？
      <NuxtLink to="/login" class="text-[var(--accent)] hover:underline">前往登入</NuxtLink>
    </div>
  </form>
</template>
