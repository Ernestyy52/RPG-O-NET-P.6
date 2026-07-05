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
    },
  },
  nitro: {
    preset: 'static',
  },
})
