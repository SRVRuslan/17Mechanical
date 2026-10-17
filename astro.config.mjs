import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://seventeen-mechanical-calgary.robustoak5.chatgpt.site',
  output: 'static',
  compressHTML: true,
});
