import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://17mechanical.ca',
  output: 'static',
  compressHTML: true,
  vite: {
    server: {
      proxy: { '/api/contact': { target: 'http://127.0.0.1:8788' } },
    },
  },
});
