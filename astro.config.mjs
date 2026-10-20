import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://17mechanical.ca',
  output: 'static',
  compressHTML: true,
});
