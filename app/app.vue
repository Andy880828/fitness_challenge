<script setup lang="ts">
import ChangelogButton from '~/components/changelog/ChangelogButton.vue'

useHead({
  bodyAttrs: { class: 'min-h-screen' },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
  <ChangelogButton />
</template>
