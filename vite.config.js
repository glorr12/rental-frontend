import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Django backend is not modified in any way (in particular, it has no CORS headers
// configured). Instead of asking for backend changes, the dev server proxies /api, /media,
// /admin and /static through to Django so the browser only ever talks to a single origin
// (this dev server) and CORS never enters the picture. /admin and /static are proxied so the
// Django admin panel (and its own CSS/JS) work when opened through this same origin, e.g.
// http://localhost:5173/admin/ - Django itself must still be running on DJANGO_BACKEND below.
// In production, build this app and serve the static files from behind the same host/reverse
// proxy as the API for the same reason.
const DJANGO_BACKEND = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
      },
      '/media': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
      },
      '/admin': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
      },
      '/static': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
      },
    },
  },
})
