// https://nuxt.com/docs/api/configuration/nuxt-config
// Nuxt 4：srcDir 預設為 'app/'，shared/ 與 server/ 位於 rootDir
export default defineNuxtConfig({
  compatibilityDate: '2026-04-28',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@vueuse/motion/nuxt',
  ],

  // 元件 auto-import：扁平命名，不依目錄加 prefix。
  // 例如 app/components/auth/LoginForm.vue 註冊為 <LoginForm />（而非 <AuthLoginForm />）
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: [
    '~/assets/styles/tokens.css',
    '~/assets/styles/main.css',
  ],

  app: {
    head: {
      title: '12週減脂增肌挑戰賽 / FORGE',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '12週減脂增肌挑戰賽，男女組獨立排行榜，公開即時計分' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    cronSecret: process.env.CRON_SECRET,
    logLevel: process.env.NUXT_LOG_LEVEL || 'info',
    logRetentionDays: Number(process.env.NUXT_LOG_RETENTION_DAYS || 30),
    public: {
      challengeStartDate: process.env.NUXT_PUBLIC_CHALLENGE_START_DATE || '2026-05-07',
      totalDays: Number(process.env.NUXT_PUBLIC_TOTAL_DAYS || 84),
    },
  },

  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirect: false, // 由 app/middleware/auth.ts 自行處理重導
  },
})
