<script setup lang="ts">
interface Props {
  values: number[]
  width?: number
  height?: number
  stroke?: string
}
const props = withDefaults(defineProps<Props>(), {
  width: 220,
  height: 60,
  stroke: 'var(--accent)',
})

const path = computed(() => {
  const pts = props.values.filter(v => Number.isFinite(v))
  if (pts.length < 2) return ''
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const stepX = props.width / (pts.length - 1)
  return pts
    .map((v, i) => {
      const x = i * stepX
      const y = props.height - ((v - min) / range) * props.height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="block w-full h-auto overflow-visible"
    :style="{ maxWidth: `${width}px`, aspectRatio: `${width} / ${height}` }"
  >
    <path
      v-if="path"
      :d="path"
      fill="none"
      :stroke="stroke"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
