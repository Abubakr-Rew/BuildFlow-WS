# BuildFlow landing page: brief

- Use the ui-ux-pro-max:ui-ux-pro-max skill for all design decisions (style, colors, typography, layout, UX checks).

Build a single-page informational website (landing page) for the project "BuildFlow".

HOW TO WORK
- First save this whole message as BRIEF.md in the project root, so it can be reused in future sessions.
- Then show a short plan and WAIT for my approval.
- After I approve, work autonomously until the site is done.
- Run the site locally and verify it in the browser at mobile (375 px), tablet (768 px) and desktop (1440 px) widths.
- Do not claim completion without verifying. If something fails, fix it and verify again.
- Use the ui-ux-pro-max skill for all design decisions (style, colors, typography, layout, UX checks).

PROJECT FACTS (use only these, do not invent anything)
- BuildFlow is a mobile app (Android and iOS) for small construction companies in Bishkek, Kyrgyzstan. The name is temporary.
- A foreman (прораб) sends a daily photo report from the site in under 2 minutes. The company owner sees what was actually done today in a feed per site.
- The product is in development, in the stage of testing the idea. There are NO customers, NO reviews, NO statistics, NO case studies and NO app-store links yet. Never fabricate any of these (no fake testimonials, numbers, logos, "trusted by", download buttons or ratings).
- Goal of the site: find construction companies for a free 2-week pilot on one site, and people willing to give a 20-30 minute interview.
- Do not mention or compare with competitors on the site.

AUDIENCE
Owners and managers of small and medium construction companies, and foremen, in Bishkek. They are busy, practical, mostly on phones. Language: Russian only. Short sentences, no jargon, no startup buzzwords.

PAGE STRUCTURE AND COPY (Russian, use as written, you may polish wording slightly)
1. Hero
   - Headline: "Знайте, что сделано на объекте, в тот же день"
   - Subline: "BuildFlow: прораб отправляет фото-отчёт за 2 минуты, владелец видит ленту по каждому объекту. Без лишних таблиц и чатов."
   - Buttons: "Хочу попробовать бесплатно" (scrolls to contact), "Как это работает" (scrolls to How it works).
   - Badge: "Проект в разработке. Ищем компании для бесплатного пилота".
   - Next to the text: a CSS/SVG phone mockup with a sample report feed (clearly fake placeholder data), labeled "Пример интерфейса".
2. Problem
   - Title: "Знакомая картина?"
   - Items: отчёты приходят в WhatsApp и Telegram вперемешку; фото теряются в переписке; о задержке узнаёшь поздно; непонятно, что реально сделано за день.
   - Small note under it: "Это наши гипотезы. Мы проверяем их в разговорах со строителями."
3. How it works (3 steps)
   1) Прораб открывает приложение и выбирает объект.
   2) Делает фото и пишет пару строк.
   3) Владелец сразу видит отчёт в ленте объекта.
4. What the first version does
   - Вход для владельца и прораба; объекты; дневной отчёт с фото; лента отчётов для владельца; простой интерфейс с крупными кнопками, русский язык.
   - "Чего пока нет": задачи со сроками, заявки на материалы, бухгалтерия.
   - "Добавим только то, что подтвердят сами строители."
5. Pilot offer
   - Title: "Бесплатный пилот на одном объекте"
   - Text: "Мы подключим одну компанию на 2 недели. Вы пользуетесь, мы каждый день слушаем обратную связь и подстраиваем приложение. Без обязательств."
   - Conditions as bullets: 2 недели, один объект, бесплатно, можно остановиться в любой момент.
   - Button: "Хочу пилот" (opens Telegram/WhatsApp with the pilot message).
6. Interview invite
   - "Не готовы к пилоту? Поговорим 20-30 минут о том, как у вас устроены отчёты с объектов. Продавать ничего не будем."
   - Button: "Готов поговорить" (opens Telegram/WhatsApp with the interview message).
7. Contact
   - Telegram, WhatsApp and email links. No backend and no form that stores personal data: contact is via these links only.
   - WhatsApp and Telegram links support a prefilled message:
     pilot: "Здравствуйте! Хочу бесплатный пилот BuildFlow."
     interview: "Здравствуйте! Готов поговорить о BuildFlow."
   - All values come from the config file.
8. About
   - "Проект делает студент-программист из Бишкека. Мы только начинаем и хотим сделать инструмент, который действительно нужен на стройке."
   - Name and photo are optional: leave a TODO in the config; if empty, show nothing in their place.
9. Footer
   - Copyright with the current year (computed at build time), note "BuildFlow: рабочее название", city Bishkek. No fake legal entity.

DESIGN
- Construction-friendly, clean and modern, not a generic template. Deep graphite neutrals with a safety-orange accent, strong contrast (WCAG AA minimum), large readable text (16 px minimum body), generous spacing, 8-pt grid.
- Cyrillic-friendly font, self-hosted via @fontsource (Manrope, Inter or Golos Text). No external font requests.
- Simple CSS/SVG illustrations (blueprint grid, hard-hat/site motifs). No copyrighted images, real brand logos or stock photos of real people.
- Update 2026-10-22: own or properly licensed construction photos (for example under the Pexels or Unsplash license) are allowed, as long as they show no identifiable people and no brands. Record source, author and license in CREDITS.md.
- Light and dark mode via prefers-color-scheme.
- Subtle scroll animations; disable them with prefers-reduced-motion.
- Mobile-first, sticky header with the logo and a contact button. Tap targets at least 44 px.

TECH
- Stack: Astro + Tailwind CSS + TypeScript, static output. A landing page needs almost no JavaScript; Astro ships plain HTML, which makes high Lighthouse scores and good SEO easy. Use small inline scripts only where needed, no React unless a part really requires it.
- If the current folder already contains a different starter project, tell me before replacing anything.
- No backend, no database, no cookies, no trackers, no analytics.
- Config file src/site.config.ts with: siteName, siteUrl (TODO, placeholder https://example.com), telegramUsername, whatsappNumber, email, pilot and interview messages, author name/photo (optional). Mark every placeholder with // TODO. Build the Telegram/WhatsApp/mailto links from these values.
- Semantic HTML, lang="ru", alt text, keyboard navigation, visible focus states, skip-to-content link.
- SEO: title, meta description, canonical, Open Graph and Twitter tags, favicon (SVG + PNG), sitemap and robots.txt (using siteUrl), a simple generated OG image 1200x630 in the site style.
- Target: Lighthouse performance, accessibility, best practices and SEO at 95+ on mobile.

VERIFICATION
- Use Playwright MCP to take screenshots at 375, 768 and 1440 px, in light and dark mode. Look at them and fix layout problems (overflow, cut text, overlapping, small tap targets).
- Check that all anchor buttons scroll to the right sections and all contact links open correct URLs.
- Run npm run build, then npm run preview, then npx lighthouse against the preview URL (mobile preset). Fix issues below 95.
- Check there is no horizontal scroll at 375 px and no console errors.

DELIVERABLES
- Working site: npm run dev, npm run build, npm run preview.
- Clean project structure; Git repository with .gitignore and small, clear commits.
- README in Russian: how to run, how to edit texts and contacts, how to deploy to a free static host (GitHub Pages, Cloudflare Pages or Netlify).
- Short CLAUDE.md for future sessions: key facts, rules (no fake data, Russian only), stack, commands, file structure, pointer to BRIEF.md.
- Final report: list of sections with status, how each was verified, paths to screenshots, Lighthouse scores.
