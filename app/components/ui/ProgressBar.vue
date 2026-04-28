<script setup lang="ts">
interface Props {
  value: number // 0..100
}
defineProps<Props>()
</script>

<template>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: `${Math.max(0, Math.min(100, value))}%` }" />
  </div>
</template>
