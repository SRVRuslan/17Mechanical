import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://17mechanical.ruslan-savchuk-dev-ca.workers.dev',
  output: 'static',
  compressHTML: true,
});
