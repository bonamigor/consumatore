export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  srcDir: 'app',

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  css: ['~/assets/css/main.css'],

  imports: {
    dirs: [
      'composables',
      'composables/**',
      'services',
      'utils',
    ],
  },

  runtimeConfig: {
    public: {
      // Em produção (Vercel): defina NUXT_PUBLIC_API_BASE com a URL pública da API no Railway
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    },
  },

  nitro: process.env.VERCEL ? { preset: 'vercel' } : {},

  app: {
    head: {
      title: 'Sistema de Pedidos',
      meta: [
        { name: 'description', content: 'Sistema de pedidos e catálogo de estantes' },
      ],
    },
  },
})
