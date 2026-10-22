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
const WIDTHS = [375, 768, 1024, 1440];
const SCHEMES = ['light', 'dark'];
const MIN_TARGET = 44;

const failures = [];
const passes = [];
const check = (ok, message) => (ok ? passes : failures).push(message);

await mkdir(SECTION_SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

/**
 * WCAG contrast of every visible text element against its composited background.
 * Runs in the page; colors go through a canvas so any CSS color syntax works.
 */
function findContrastIssues() {
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', {
    willReadFrequently: true,
  });
  const rgba = (color) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const backgroundOf = (el) => {
    const layers = [];
    for (let node = el; node; node = node.parentElement) {
      const color = rgba(getComputedStyle(node).backgroundColor);
      if (color.a > 0) layers.push(color);
      if (color.a >= 1) break;
    }
    return layers.reverse().reduce((acc, layer) => over(layer, acc), { r: 255, g: 255, b: 255, a: 1 });
  };
  const luminance = ({ r, g, b }) => {
    const channel = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const ratio = (x, y) => {
    const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
    return (hi + 0.05) / (lo + 0.05);
  };

  const issues = [];
  let checked = 0;
  let lowest = Infinity;
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (rect.width < 2 || rect.height < 2 || style.visibility === 'hidden' || el.closest('.sr-only')) continue;
    const background = backgroundOf(el);
    const value = ratio(over(rgba(style.color), background), background);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
    const needed = large ? 3 : 4.5;
    checked += 1;
    lowest = Math.min(lowest, value);
    if (value < needed) issues.push(`"${el.textContent.trim().slice(0, 30)}" ${value.toFixed(2)}:1 (needs ${needed}:1)`);
  }
  return { checked, lowest: Number(lowest.toFixed(2)), issues };
}

/**
 * Contrast of text over the hero photo, measured on real pixels: the hero is captured
 * with all text made transparent, then each line of text is compared with the lightest
 * 5% of the background pixels behind it.
 */
async function photoTextContrast(page) {
  const lines = await page.evaluate(() => {
    const root = document.querySelector('[data-photo]');
    const origin = root.getBoundingClientRect();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const result = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!node.textContent.trim() || el.closest('.sr-only')) continue;
      // The phone and its tilted cards have solid backgrounds (covered by the DOM check);
      // a rotated card's box would also take in photo pixels outside the card.
      if (el.closest('[data-mockup] [aria-hidden="true"]')) continue;
      const style = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 2 || rect.height < 2) continue;
        result.push({
          text: node.textContent.trim().slice(0, 30),
          color: style.color,
          size: parseFloat(style.fontSize),
          weight: parseInt(style.fontWeight, 10),
          x: rect.left - origin.left,
          y: rect.top - origin.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
    return result;
  });

  const hideText = await page.addStyleTag({
    // transition: none, or buttons would be captured mid-fade with their text still showing.
    content: '[data-photo] *, [data-photo] *::before, [data-photo] *::after { color: transparent !important; text-shadow: none !important; transition: none !important; } header { position: static !important; }',
  });
  const png = await page.locator('[data-photo]').screenshot();
  await hideText.evaluate((node) => node.remove());

  return page.evaluate(
    async ({ base64, lines }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const probe = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', {
        willReadFrequently: true,
      });
      const rgb = (color) => {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = color;
        probe.fillRect(0, 0, 1, 1);
        return probe.getImageData(0, 0, 1, 1).data;
      };
      const channel = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const luminance = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

      const issues = [];
      let lowest = Infinity;
      for (const line of lines) {
        const x = Math.max(0, Math.floor(line.x));
        const y = Math.max(0, Math.floor(line.y));
        const width = Math.min(canvas.width - x, Math.ceil(line.width));
        const height = Math.min(canvas.height - y, Math.ceil(line.height));
        if (width < 1 || height < 1) continue;
        const data = ctx.getImageData(x, y, width, height).data;
        const values = [];
        for (let i = 0; i < data.length; i += 4) values.push(luminance(data[i], data[i + 1], data[i + 2]));
        values.sort((a, b) => a - b);
        const [fr, fg, fb] = rgb(line.color);
        const text = luminance(fr, fg, fb);
        // Light text: the lightest background pixels are the worst case; dark text: the darkest.
        const background = text > 0.5 ? values[Math.floor(values.length * 0.95)] : values[Math.floor(values.length * 0.05)];
        const ratio = (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
        const needed = line.size >= 24 || (line.size >= 18.66 && line.weight >= 700) ? 3 : 4.5;
        lowest = Math.min(lowest, ratio);
        if (ratio < needed) issues.push(`"${line.text}" ${ratio.toFixed(2)}:1 (needs ${needed}:1)`);
      }
      return { checked: lines.length, lowest: Number(lowest.toFixed(2)), issues };
    },
    { base64: png.toString('base64'), lines },
  );
}

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
    const contrast = await page.evaluate(findContrastIssues);
    check(
      contrast.issues.length === 0,
      `${tag}: text contrast meets WCAG AA (${contrast.checked} text elements, lowest ${contrast.lowest}:1)` +
        (contrast.issues.length ? `; ${contrast.issues.join('; ')}` : ''),
    );
    const photo = await photoTextContrast(page);
    check(
      photo.issues.length === 0,
      `${tag}: text over the hero photo meets WCAG AA on real pixels (${photo.checked} lines, lowest ${photo.lowest}:1)` +
        (photo.issues.length ? `; ${photo.issues.join('; ')}` : ''),
    );

    // The hero photo: right crop for the width, a modern format, loaded eagerly with high priority.
    const heroImage = await page.evaluate(() => {
      const img = document.querySelector('[data-photo] img');
      return {
        src: img.currentSrc,
        loaded: img.complete && img.naturalWidth > 0,
        eager: img.loading === 'eager' && img.getAttribute('fetchpriority') === 'high',
        sized: img.hasAttribute('width') && img.hasAttribute('height'),
      };
    });
    const crop = width < 640 ? 'tall' : 'wide';
    check(
      heroImage.loaded && heroImage.eager && heroImage.sized && heroImage.src.includes(crop) && /\.(avif|webp)/.test(heroImage.src),
      `${tag}: hero photo uses the ${crop} crop as AVIF/WebP, eager, high priority, with width/height (${heroImage.src.split('/').pop()})`,
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

// 1a. On a 1440x900 screen the hero fits and the next section peeks out below it.
{
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const fit = await page.evaluate(() => ({
    heroBottom: Math.round(document.querySelector('#top').getBoundingClientRect().bottom),
    labelTop: Math.round(document.querySelector('#problem p').getBoundingClientRect().top),
  }));
  check(
    fit.heroBottom <= 860 && fit.labelTop < 900,
    `1440x900: hero ends at ${fit.heroBottom}px and the next section's label starts at ${fit.labelTop}px (visible)`,
  );
  await context.close();
}

// 1b. Narrow Android phones, a phone in landscape, and text enlarged to 200%: no horizontal scroll.
const extraLayouts = [
  { name: '320px', viewport: { width: 320, height: 800 } },
  { name: '360px', viewport: { width: 360, height: 800 } },
  { name: 'landscape 812x375', viewport: { width: 812, height: 375 }, shot: 'landscape-812-light-fold.png' },
  { name: '375px with 200% text', viewport: { width: 375, height: 800 }, css: 'html { font-size: 200% !important; }', shot: '375-light-text200-full.png', fullPage: true },
];
for (const layout of extraLayouts) {
  const { context, page } = await openPage({ viewport: layout.viewport, reducedMotion: 'reduce' });
  if (layout.css) await page.addStyleTag({ content: layout.css });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  check(scrollWidth <= clientWidth, `${layout.name}: no horizontal scroll (scrollWidth ${scrollWidth}, viewport ${clientWidth})`);
  if (layout.shot) await page.screenshot({ path: shot(layout.shot), fullPage: layout.fullPage ?? false });
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
  const obscured = [];
  let stops = 0;
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const header = document.querySelector('header').getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30),
        outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        // WCAG 2.2 focus not obscured: the sticky header must not cover it.
        hidden: !el.closest('header') && el.getAttribute('href') !== '#main' && rect.top < header.bottom - 1,
      };
    });
    if (!state) break;
    stops += 1;
    if (state.outline === 'none' || state.width < 2) unfocusable.push(state.text);
    if (state.hidden) obscured.push(state.text);
  }
  check(stops > 15 && unfocusable.length === 0, `visible focus ring on all ${stops} keyboard stops` + (unfocusable.length ? `; missing on: ${unfocusable.join(', ')}` : ''));
  check(obscured.length === 0, `focused elements are never under the sticky header` + (obscured.length ? `; covered: ${obscured.join(', ')}` : ''));
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
  const floating = await page.$$eval('.animate-float', (els) => els.map((el) => getComputedStyle(el).animationName));
  check(floating.length > 0 && floating.every((name) => name === 'float'), `floating sample cards drift with motion allowed (${floating.join(', ')})`);
  await context.close();

  const reduced = await openPage({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
  const hiddenReduced = await reduced.page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
  check(hiddenReduced === 0, `reduced motion: all blocks visible without scrolling (${hiddenReduced} hidden)`);
  const still = await reduced.page.$$eval('.animate-float', (els) => els.map((el) => getComputedStyle(el).animationName));
  check(still.every((name) => name === 'none'), `reduced motion: floating cards stand still (${still.join(', ')})`);
  await reduced.context.close();
}

await browser.close();

const summary = { url: BASE_URL, date: new Date().toISOString(), passed: passes.length, failed: failures.length, failures, passes };
await writeFile(new URL('verify.json', REPORTS), JSON.stringify(summary, null, 2));
for (const line of passes) console.log(`PASS  ${line}`);
for (const line of failures) console.log(`FAIL  ${line}`);
console.log(`\n${passes.length} passed, ${failures.length} failed. Screenshots: reports/screenshots/`);
process.exitCode = failures.length ? 1 : 0;
