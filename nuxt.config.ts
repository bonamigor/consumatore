// A API é servida pelo próprio domínio do frontend (/api/** → backend), assim o cookie
// HttpOnly de autenticação é de primeira parte e o navegador nunca precisa de CORS.
const apiProxyTarget = (process.env.API_PROXY_TARGET || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080')
  .replace(/\/$/, '')

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

  // Em produção (Vercel): defina API_PROXY_TARGET com a URL pública da API no Railway
  routeRules: {
    '/api/**': { proxy: `${apiProxyTarget}/api/**` },
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
