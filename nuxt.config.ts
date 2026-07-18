// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },
  runtimeConfig: {
    public: {
      sheetsApiUrl: process.env.NUXT_PUBLIC_SHEETS_API_URL || '',
      // Colyseus multiplayer server (ws://... หรือ wss://...) — เว้นว่าง = เล่นออฟไลน์ปกติ
      colyseusUrl: process.env.NUXT_PUBLIC_COLYSEUS_URL || '',
    },
  },
  nitro: {
    preset: 'static',
  },
  hooks: {
    // หน้า /dev/* (asset gallery ฯลฯ) มีเฉพาะตอน dev — ห้ามหลุดเข้า production bundle
    'pages:extend'(pages) {
      if (process.env.NODE_ENV === 'production') {
        const kept = pages.filter((p) => !(p.path && p.path.startsWith('/dev')))
        pages.splice(0, pages.length, ...kept)
      }
    },
  },
})
