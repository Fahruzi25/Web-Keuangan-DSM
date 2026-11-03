import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      // Dipakai hanya bila VITE_API_BASE_URL kosong (alamat API '/api'):
      // permintaan diteruskan ke backend di alamat ini.
      proxy: { '/api': env.VITE_PROXY_TARGET || 'http://localhost:3000' },
    },
  }
})
