# BuildBetter landing page

Single-page site that recruits small Bishkek construction companies for a free 2-week pilot and people for 20–30 minute interviews. The full brief is in [BRIEF.md](BRIEF.md); read it before changing content or design.

## Rules

- Site copy is Russian only: short sentences, no jargon or startup buzzwords.
- Use only facts from BRIEF.md. The product is in development, so there are no customers, reviews, statistics, case studies, logos, "trusted by", ratings or app-store/download buttons. Never invent them.
- The phone mockup's sample data, including the floating cards around it, stays obviously fake and labelled "Пример интерфейса".
- Photos must be your own or properly licensed (for example Pexels or Unsplash), with no identifiable people and no brands. Record each one in `CREDITS.md`.
- Never mention or compare with competitors.
- No backend, forms, cookies, trackers or analytics. Contact is Telegram, WhatsApp and mailto links built from `src/site.config.ts`.
- Make design decisions (style, color, type, layout, UX checks) with the `ui-ux-pro-max` skill.

## Stack and commands

Astro 7 (static output), Tailwind CSS 4 via `@tailwindcss/vite`, strict TypeScript. Node >= 22.23.4.

- `npm run dev`, `npm run build` (runs `astro check` first), `npm run preview`
- `npm run verify` runs `scripts/verify.mjs` (playwright-core + installed Chrome) against a running preview. It covers:
  - screenshots in `reports/screenshots/`;
  - overflow, tap targets >= 44px and WCAG contrast in both themes;
  - contrast of text over the hero photo, measured on real pixels;
  - the hero fitting a 1440x900 screen;
  - anchors and exact contact URLs;
  - keyboard and reduced motion.

  Keep it at 0 failures.
- `npm run lighthouse`: Lighthouse 13 mobile report in `reports/lighthouse/`. Target 95+ in every category.
- `reports/` is gitignored.

## Where things live

- `src/site.config.ts` holds `siteUrl`, contacts, prefilled messages and the optional author.
  - The origin of `siteUrl` becomes Astro `site` and its path becomes `base`.
  - Placeholders are marked `// TODO`, and the build warns while they remain.
- `src/texts.ts` holds all visible copy. `typographAll()` adds non-breaking spaces after short words.
- `src/lib/links.ts` builds `t.me/<user>?text=`, `wa.me/<digits>?text=` and `mailto:` links.
- `src/styles/global.css`:
  - Semantic color tokens with light and dark values (`prefers-color-scheme`). Tailwind's default palette is disabled, so use `bg-bg`, `bg-surface`, `bg-sunken`, `text-fg`, `text-muted`, `bg-accent`, `text-accent-ink`, `bg-inverse` and similar.
  - Spacing is px-based (`--spacing: 4px`, 8-pt grid).
  - The `[data-reveal]` scroll animation lives here too.
- `src/components/` has one component per section. `MessengerButtons` renders every Telegram/WhatsApp button pair.
- Hero:
  - `Hero.astro` builds an art-directed `<picture>` with `getImage()`: the tall crop for phones, the wide one from 640px.
  - The photos are `src/assets/hero/*`, prepared by `scripts/prepare-hero-photo.mjs`.
  - The hero uses the theme-independent `night` tokens, so it is dark in both themes. The phone screen inside it follows the page theme.
- Page rhythm: light/dark sections alternate `bg` and `sunken`, and the pilot offer is the single orange band (`tone="accent"`).
- `src/lib/images.ts` and `src/pages/*.png.ts` render the OG image and favicons at build time (satori + resvg). satori needs the static `.woff` files from `@fontsource/*`, with one family name per subset.
- Fonts are Golos Text (body) and Manrope (headings) from `@fontsource-variable`, loaded through Astro's fonts API with the `local` provider. The `npm` provider with `remote: false` breaks the build in Astro 7.4.

## Conventions

- `accent` (#ea580c) is only 3.6:1 on white. Use it for fills, icons and large numerals; small orange text uses `accent-ink`.
- Give grids `grid-cols-1` on mobile (`minmax(0, 1fr)`) so long contact values wrap instead of overflowing.
- Build internal URLs with `withBase()` so they work under a GitHub Pages base path.
- Make small commits with imperative subjects.
