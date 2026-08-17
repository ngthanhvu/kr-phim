// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // PURE CLIENT — không còn server routes nữa, gọi trực tiếp Express backend
  ssr: false,

  routeRules: {
    '/api/**': { proxy: `${BACKEND_URL}/api/**` },
  },

  runtimeConfig: {
    public: {
      backendUrl: process.env.PUBLIC_BACKEND_URL || '',
      giphyApiKey: process.env.GIPHY_API_KEY,
    },
  },
  app: {
    head: {
      titleTemplate: (titleChunk) => titleChunk ? `${titleChunk}` : 'CineK - Xem phim Hàn Quốc online',
      meta: [
        { name: 'description', content: 'CineK là website xem phim Hàn Quốc online với phụ đề Vietsub, thuyết minh, lồng tiếng, hình ảnh sắc nét và kho phim được cập nhật thường xuyên.' },
        { property: 'og:site_name', content: 'CineK' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'CineK - Xem phim Hàn Quốc online' },
        { property: 'og:description', content: 'Xem phim Hàn Quốc online, phim bộ, phim lẻ, show và nội dung mới cập nhật với trải nghiệm xem mượt trên mọi thiết bị.' },
        { property: 'og:image', content: '/favicon.ico' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'CineK - Xem phim Hàn Quốc online' },
        { name: 'twitter:description', content: 'Kho phim Hàn Quốc online được cập nhật thường xuyên, hỗ trợ Vietsub, thuyết minh và lồng tiếng.' },
        { name: 'theme-color', content: '#020617' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/favicon.ico' },
      ],
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 3002,
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    server: {
      // PROXY tất cả /api/* requests tới Express backend cho dev mode
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
          cookieDomainRewrite: { '*': '' },
          cookiePathRewrite: { '*': '' },
          onProxyReq: (proxyReq, req: any) => {
            // Forward cookies from browser to backend
            const cookieHeader = req.headers?.cookie
            if (cookieHeader && !proxyReq.getHeader('cookie')) {
              proxyReq.setHeader('cookie', cookieHeader)
            }
          },
        },
      },
    },
  },
})
