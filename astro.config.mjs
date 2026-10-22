// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig, unfilledSettings } from './src/site.config.ts';

const todo = unfilledSettings();
if (todo.length > 0) {
  console.warn(`[buildflow] Placeholder values in src/site.config.ts: ${todo.join(', ')}`);
}

// siteUrl may include a path (GitHub Pages project site); it becomes the base.
const { pathname } = new URL(siteConfig.siteUrl);

export default defineConfig({
  site: siteConfig.siteUrl,
  base: pathname,
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
