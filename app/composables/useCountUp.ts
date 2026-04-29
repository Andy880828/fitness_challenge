/**
 * useCountUp — 數字從 0（或起始值）動畫到目標值。
 *
 * 用 requestAnimationFrame + ease-out cubic 緩動函式；
 * 尊重 prefers-reduced-motion，使用者關閉動畫時直接顯示終值。
 *
 * 用法：
 *   const target = computed(() => score.value.total)
 *   const display = useCountUp(target, { duration: 800, decimals: 1 })
 *   // 模板：{{ display }}
 */

import { onBeforeUnmount, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'

export interface UseCountUpOptions {
  /** 動畫時長 ms（預設 800） */
  duration?: number
  /** 顯示小數位數（預設 0） */
  decimals?: number
  /** 起始值（預設 0） */
  from?: number
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useCountUp = (
  target: MaybeRefOrGetter<number>,
  options: UseCountUpOptions = {},
) => {
  const { duration = 800, decimals = 0, from = 0 } = options

  const display = ref<string>(toValue(target).toFixed(decimals))
  let rafId: number | null = null
  let startTime = 0
  let startValue = from

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const animate = (to: number) => {
    stop()
    if (prefersReducedMotion()) {
      display.value = to.toFixed(decimals)
      return
    }
    const fromValue = startValue
    startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easeOutCubic(progress)
      const current = fromValue + (to - fromValue) * eased
      display.value = current.toFixed(decimals)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = null
        startValue = to
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  watch(
    () => toValue(target),
    (next) => animate(Number(next)),
    { immediate: true },
  )

  onBeforeUnmount(stop)

  return display
}
