<script setup lang="ts">
useHead({
  bodyAttrs: { class: 'min-h-screen' },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
</template>
