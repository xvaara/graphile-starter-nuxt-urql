// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  experimental: {
    asyncContext: true,
  },
  future: {
    compatibilityVersion: 4,
  },
  build: {
    transpile: [],
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    // https://github.com/atinux/nuxt-auth-utils
    'nuxt-auth-utils',
    // https://nuxt-security.vercel.app/getting-started/usage
    'nuxt-security',
    '@nuxt/ui',
    // '@josephanson/nuxt-ai',
    // 'nuxt-i18n-micro'
  ],
  eslint: {
    config: {
      // stylistic: true,
      standalone: false,
    },
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  security: {
    strict: !import.meta.dev,
    headers: {
    },
    csrf: {
      enabled: true,
      addCsrfTokenToEventCtx: true,
    },
  },
  routeRules: {
  },
  ui: {
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      rootUrl: import.meta.env.ROOT_URL || 'http://localhost:3000',
    },
    session: {
      cookie: {
        secure: !import.meta.dev,
      },
    },
  },
  // i18n: {
  //   locales: [
  //     { code: 'en', iso: 'en-US', dir: 'ltr' },
  //     { code: 'fi', iso: 'fi-FI', dir: 'ltr' },
  //     { code: 'es', iso: 'es-ES', dir: 'ltr' },
  //     { code: 'zh', iso: 'zh-CN', dir: 'ltr' },
  //   ],
  //   defaultLocale: 'en',
  //   translationDir: 'locales',
  //   meta: true,
  //   autoDetectLanguage: true,
  //   // strategy: 'no_prefix',
  // },
  // ai: {
  //   dev: {
  //     mcp: {
  //       additionalDocs: {
  //         'nuxt-18n-micro': {
  //           url: 'github:s00d/nuxt-i18n-micro/tree/main/docs'
  //         },
  //       }

  //     }
  //   }

  // }

})
