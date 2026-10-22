// Build-time image rendering: favicons from the mark, and the 1200x630 Open Graph image.
// satori lays out the OG card (it needs static .woff fonts), resvg rasterizes SVG to PNG.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { brand, markSvg } from './brand';
import { texts } from '../texts';

/** Rasterizes an SVG string to PNG at the given width. */
export function svgToPng(svg: string, width: number): Uint8Array<ArrayBuffer> {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  return new Uint8Array(png);
}

const fontFile = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

// satori picks one font per family name, so each subset is registered as its own
// family ("Manrope-cyrillic", "Manrope-latin") and styles list both.
const SUBSETS = ['cyrillic', 'latin'] as const;
const MANROPE = SUBSETS.map((subset) => `Manrope-${subset}`).join(', ');
const GOLOS = SUBSETS.map((subset) => `Golos-${subset}`).join(', ');

async function loadFonts() {
  const faces = [
    { name: 'Manrope', pkg: 'manrope', file: 'manrope', weight: 800 },
    { name: 'Golos', pkg: 'golos-text', file: 'golos-text', weight: 500 },
  ] as const;
  const fonts = [];
  for (const face of faces) {
    for (const subset of SUBSETS) {
      fonts.push({
        name: `${face.name}-${subset}`,
        weight: face.weight,
        style: 'normal' as const,
        data: await fontFile(face.pkg, `${face.file}-${subset}-${face.weight}-normal.woff`),
      });
    }
  }
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, ...children: Array<Node | string>): Node => ({
  type,
  props: { style, children },
});

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** The social preview card: graphite blueprint, headline, safety-tape stripe. */
export async function renderOgImage(): Promise<Uint8Array<ArrayBuffer>> {
  const card = el(
    'div',
    {
      // satori sizes boxes as content-box by default; without this the padding enlarges the card.
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '64px 72px',
      backgroundColor: brand.graphite,
      backgroundImage: `linear-gradient(${brand.lineOnGraphite} 1px, transparent 1px), linear-gradient(90deg, ${brand.lineOnGraphite} 1px, transparent 1px)`,
      backgroundSize: '48px 48px',
      color: brand.paper,
      fontFamily: GOLOS,
      position: 'relative',
    },
    el(
      'div',
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
      el(
        'div',
        { display: 'flex', alignItems: 'center', gap: 20 },
        { type: 'img', props: { src: dataUri(markSvg(64)), width: 64, height: 64 } },
        el('div', { fontFamily: MANROPE, fontSize: 44, fontWeight: 800 }, 'BuildFlow'),
      ),
      el(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 22px',
          border: `2px solid ${brand.lineOnGraphite}`,
          borderRadius: 999,
          backgroundColor: brand.graphite,
          fontSize: 24,
          color: brand.paper,
        },
        el('div', { width: 12, height: 12, borderRadius: 999, backgroundColor: brand.orange }),
        texts.og.badge,
      ),
    ),
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 64,
        fontFamily: MANROPE,
        fontWeight: 800,
        fontSize: 80,
        lineHeight: 1.04,
        letterSpacing: -2,
      },
      el('div', {}, texts.hero.titleStart),
      el('div', { color: brand.orange }, texts.hero.titleAccent),
    ),
    el('div', { marginTop: 36, fontSize: 34, color: brand.mutedOnGraphite }, texts.og.subline),
    el('div', {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 24,
      backgroundImage: `repeating-linear-gradient(-45deg, ${brand.orange} 0px, ${brand.orange} 16px, ${brand.graphite} 16px, ${brand.graphite} 32px)`,
    }),
  );

  const svg = await satori(card as never, { width: 1200, height: 630, fonts: await loadFonts() });
  return svgToPng(svg, 1200);
}
