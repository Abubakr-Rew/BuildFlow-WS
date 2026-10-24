// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig, unfilledSettings } from './src/site.config.ts';

const todo = unfilledSettings();
if (todo.length > 0) {
  console.warn(`[buildbetter] Placeholder values in src/site.config.ts: ${todo.join(', ')}`);
}

// siteUrl may include a path (GitHub Pages project site): the origin becomes `site`, the path `base`.
const { origin, pathname } = new URL(siteConfig.siteUrl);

// Fonts come from the installed @fontsource-variable packages and are served by
// this site. Only the Cyrillic and Latin subsets are used; the unicode ranges
// are copied from the packages' wght.css.
const GOLOS = '@fontsource-variable/golos-text/files/golos-text';
const MANROPE = '@fontsource-variable/manrope/files/manrope';
/** @type {[string, ...string[]]} */
const CYRILLIC = ['U+0301', 'U+0400-045F', 'U+0490-0491', 'U+04B0-04B1', 'U+2116'];
/** @type {[string, ...string[]]} */
const LATIN = [
  'U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC',
  'U+0304', 'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193',
  'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD',
];

export default defineConfig({
  site: origin,
  // A trailing slash keeps the sitemap from listing the home page twice.
  base: pathname.endsWith('/') ? pathname : `${pathname}/`,
  output: 'static',
  build: {
    // The whole stylesheet is small; inlining it removes a render-blocking request.
    inlineStylesheets: 'always',
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Golos Text',
      cssVariable: '--font-golos',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: [`${GOLOS}-cyrillic-wght-normal.woff2`], weight: '400 900', style: 'normal', unicodeRange: CYRILLIC },
          { src: [`${GOLOS}-latin-wght-normal.woff2`], weight: '400 900', style: 'normal', unicodeRange: LATIN },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: [`${MANROPE}-cyrillic-wght-normal.woff2`], weight: '200 800', style: 'normal', unicodeRange: CYRILLIC },
          { src: [`${MANROPE}-latin-wght-normal.woff2`], weight: '200 800', style: 'normal', unicodeRange: LATIN },
        ],
      },
    },
  ],
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
