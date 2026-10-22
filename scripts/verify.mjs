// Checks the built site in the installed Google Chrome (via playwright-core).
// Start the server first (`npm run build && npm run preview`), then:
//   node scripts/verify.mjs [url]        default url: http://localhost:4321/
// Screenshots go to reports/screenshots/, a summary to reports/verify.json.
// Exits with code 1 when any check fails.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { siteConfig } from '../src/site.config.ts';

const BASE_URL = process.argv[2] ?? 'http://localhost:4321/';
const REPORTS = new URL('../reports/', import.meta.url);
const SHOTS = new URL('screenshots/', REPORTS);
const SECTION_SHOTS = new URL('sections/', SHOTS);
const shot = (name, dir = SHOTS) => fileURLToPath(new URL(name, dir));
const WIDTHS = [375, 768, 1440];
const SCHEMES = ['light', 'dark'];
const MIN_TARGET = 44;

const failures = [];
const passes = [];
const check = (ok, message) => (ok ? passes : failures).push(message);

await mkdir(SECTION_SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

/** Opens the page and records console errors, page errors and failed requests. */
async function openPage(contextOptions) {
  const context = await browser.newContext(contextOptions);
  // Never leave the machine: messenger links are answered locally.
  await context.route(/^https:\/\/(t\.me|wa\.me)\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`console: ${msg.text()}`));
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => errors.push(`request failed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

// 1. Layout at each width and color scheme: screenshots, overflow, tap targets, text size.
for (const width of WIDTHS) {
  for (const scheme of SCHEMES) {
    const tag = `${width}px ${scheme}`;
    const { context, page, errors } = await openPage({
      viewport: { width, height: 900 },
      colorScheme: scheme,
      reducedMotion: 'reduce',
    });

    await page.screenshot({ path: shot(`${width}-${scheme}-fold.png`) });
    await page.screenshot({ path: shot(`${width}-${scheme}-full.png`), fullPage: true });

    const layout = await page.evaluate((minTarget) => {
      const root = document.documentElement;
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden';
      };
      const describe = (el) =>
        `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;

      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => visible(el) && el.getBoundingClientRect().right > root.clientWidth + 0.5)
        .slice(0, 5)
        .map(describe);

      const smallTargets = [...document.querySelectorAll('a[href], button')]
        .filter(visible)
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width < minTarget || rect.height < minTarget;
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return `${describe(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
        });

      const tinyText = [...document.querySelectorAll('body *')]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((el) => visible(el) && parseFloat(getComputedStyle(el).fontSize) < 12)
        .map(describe);

      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        wide,
        smallTargets,
        tinyText,
        background: getComputedStyle(document.body).backgroundColor,
      };
    }, MIN_TARGET);

    check(
      layout.scrollWidth <= layout.clientWidth,
      `${tag}: no horizontal scroll (scrollWidth ${layout.scrollWidth}, viewport ${layout.clientWidth})` +
        (layout.wide.length ? `; widest: ${layout.wide.join(', ')}` : ''),
    );
    check(
      layout.smallTargets.length === 0,
      `${tag}: tap targets >= ${MIN_TARGET}px` +
        (layout.smallTargets.length ? `; too small: ${layout.smallTargets.join('; ')}` : ''),
    );
    check(
      layout.tinyText.length === 0,
      `${tag}: no text under 12px` + (layout.tinyText.length ? `; ${layout.tinyText.join('; ')}` : ''),
    );
    const expectedBackground = scheme === 'dark' ? 'rgb(17, 18, 20)' : 'rgb(244, 244, 241)';
    check(layout.background === expectedBackground, `${tag}: ${scheme} theme applied (${layout.background})`);
    check(errors.length === 0, `${tag}: no console errors or failed requests` + (errors.length ? `; ${errors.join('; ')}` : ''));

    // Section-by-section shots are easier to review than one tall page.
    await page.addStyleTag({ content: 'header { position: static !important; }' });
    for (const id of await page.$$eval('main section[id]', (els) => els.map((el) => el.id))) {
      await page.locator(`section#${id}`).screenshot({ path: shot(`${width}-${scheme}-${id}.png`, SECTION_SHOTS) });
    }
    await page.locator('footer').screenshot({ path: shot(`${width}-${scheme}-footer.png`, SECTION_SHOTS) });

    await context.close();
  }
}

// 1b. Narrow Android phones: no horizontal scroll.
for (const width of [320, 360]) {
  const { context, page } = await openPage({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  check(scrollWidth <= clientWidth, `${width}px: no horizontal scroll (scrollWidth ${scrollWidth})`);
  await context.close();
}

// 2. Anchor links land on their sections, below the sticky header.
for (const width of [375, 1440]) {
  const { context, page } = await openPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const anchors = [];
  for (const handle of await page.$$('a[href^="#"]')) {
    if (!(await handle.isVisible())) continue;
    const box = await handle.boundingBox();
    if (!box || box.width <= 1) continue; // the skip link while not focused
    anchors.push({
      handle,
      href: await handle.getAttribute('href'),
      text: (await handle.textContent()).trim().replace(/\s+/g, ' '),
    });
  }
  for (const anchor of anchors) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await anchor.handle.click();
    await page.waitForTimeout(150);
    const result = await page.evaluate((href) => {
      const target = document.querySelector(href);
      if (!target) return { exists: false };
      const header = document.querySelector('header').getBoundingClientRect();
      const top = target.getBoundingClientRect().top;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      return { exists: true, top: Math.round(top), headerBottom: Math.round(header.bottom), atBottom, hash: location.hash };
    }, anchor.href);
    const landed =
      result.exists &&
      result.hash === anchor.href &&
      ((result.top >= result.headerBottom - 1 && result.top <= 120) || (result.atBottom && result.top >= result.headerBottom - 1));
    check(landed, `${width}px: "${anchor.text}" → ${anchor.href} (section top ${result.top}px, header ends ${result.headerBottom}px)`);
  }
  await context.close();
}

// 3. Contact links: exact URLs built from site.config.ts, opened in a new tab.
{
  const encode = encodeURIComponent;
  const tg = `https://t.me/${siteConfig.telegramUsername.replace(/^@/, '')}`;
  const wa = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, '')}`;
  const pilot = { telegram: `${tg}?text=${encode(siteConfig.messages.pilot)}`, whatsapp: `${wa}?text=${encode(siteConfig.messages.pilot)}` };
  const interview = { telegram: `${tg}?text=${encode(siteConfig.messages.interview)}`, whatsapp: `${wa}?text=${encode(siteConfig.messages.interview)}` };
  const mail = `mailto:${siteConfig.email}?subject=${encode(siteConfig.siteName)}`;
  const expected = {
    '#pilot': [pilot.telegram, pilot.whatsapp],
    '#interview': [interview.telegram, interview.whatsapp],
    '#contact': [pilot.telegram, pilot.whatsapp, mail],
    footer: [tg, wa, mail],
  };

  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  for (const [scope, urls] of Object.entries(expected)) {
    const links = await page.$$eval(`${scope} a[href^="https://t.me"], ${scope} a[href^="https://wa.me"], ${scope} a[href^="mailto:"]`, (as) =>
      as.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel })),
    );
    const hrefs = links.map((l) => l.href);
    check(JSON.stringify(hrefs) === JSON.stringify(urls), `${scope}: links ${JSON.stringify(hrefs)}`);
    const external = links.filter((l) => !l.href.startsWith('mailto:'));
    check(
      external.every((l) => l.target === '_blank' && l.rel.includes('noopener')),
      `${scope}: messenger links open in a new tab with rel=noopener`,
    );
  }

  // Decode the prefilled text to be sure it survives encoding.
  const decoded = new URL(pilot.telegram).searchParams.get('text');
  check(decoded === siteConfig.messages.pilot, `pilot message decodes back to "${decoded}"`);

  // Clicking really opens the right URL in a new tab.
  for (const [label, url] of [['pilot Telegram', pilot.telegram], ['interview WhatsApp', interview.whatsapp]]) {
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.locator(`a[href="${url}"]`).first().click(),
    ]);
    await popup.waitForLoadState();
    check(popup.url() === url, `click "${label}" opens ${popup.url()}`);
    await popup.close();
  }
  await context.close();
}

// 4. Keyboard: skip link first, visible focus on every stop.
{
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    const rect = el.getBoundingClientRect();
    return { href: el.getAttribute('href'), text: el.textContent.trim(), width: rect.width, top: rect.top };
  });
  check(skip.href === '#main' && skip.width > 40 && skip.top >= 0, `first Tab shows the skip link ("${skip.text}")`);
  await page.keyboard.press('Enter');
  const afterSkip = await page.evaluate(() => document.activeElement.id);
  check(afterSkip === 'main', `skip link moves focus to <main> (got "${afterSkip}")`);

  // Walk every Tab stop from the top of the page.
  await page.reload();
  const unfocusable = [];
  let stops = 0;
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    if (!state) break;
    stops += 1;
    if (state.outline === 'none' || state.width < 2) unfocusable.push(state.text);
  }
  check(stops > 15 && unfocusable.length === 0, `visible focus ring on all ${stops} keyboard stops` + (unfocusable.length ? `; missing on: ${unfocusable.join(', ')}` : ''));
  await context.close();
}

// 5. Scroll reveal: animated with motion allowed, instant with reduced motion.
{
  const { context, page } = await openPage({ viewport: { width: 375, height: 800 }, reducedMotion: 'no-preference' });
  const hiddenBefore = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity === '0').length);
  for (let y = 0; y < 20000; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(600);
  const stillHidden = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
  check(hiddenBefore > 0 && stillHidden === 0, `reveal: ${hiddenBefore} blocks start hidden below the fold, ${stillHidden} hidden after scrolling`);
  await context.close();

  const reduced = await openPage({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
  const hiddenReduced = await reduced.page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
  check(hiddenReduced === 0, `reduced motion: all blocks visible without scrolling (${hiddenReduced} hidden)`);
  await reduced.context.close();
}

await browser.close();

const summary = { url: BASE_URL, date: new Date().toISOString(), passed: passes.length, failed: failures.length, failures, passes };
await writeFile(new URL('verify.json', REPORTS), JSON.stringify(summary, null, 2));
for (const line of passes) console.log(`PASS  ${line}`);
for (const line of failures) console.log(`FAIL  ${line}`);
console.log(`\n${passes.length} passed, ${failures.length} failed. Screenshots: reports/screenshots/`);
process.exitCode = failures.length ? 1 : 0;
