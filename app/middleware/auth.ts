/**
 * 路由守衛 — 未登入導向 /login
 * 用於 pages/checkin.vue / pages/dashboard.vue 透過 definePageMeta({ middleware: 'auth' }) 啟用
 */

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
