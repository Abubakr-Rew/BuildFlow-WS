/** Brand colors for generated images (favicons, OG image); match the light tokens in global.css. */
export const brand = {
  orange: '#ea580c',
  graphite: '#17181b',
  paper: '#f4f4f1',
  mutedOnGraphite: '#b4b6bb',
  lineOnGraphite: '#33353a',
} as const;

/**
 * The BuildFlow mark, a hard hat on a tile, as SVG elements in a 32x32 viewBox.
 * Used by the header logo (with theme colors) and by the favicons.
 */
export function markShapes(tile: string, hat: string, radius = 7): string {
  return [
    `<rect width="32" height="32" rx="${radius}" fill="${tile}"/>`,
    `<path d="M7.5 20.5a8.5 8.5 0 0 1 17 0z" fill="${hat}"/>`,
    `<rect x="5" y="21" width="22" height="3.5" rx="1.75" fill="${hat}"/>`,
    `<path d="M14.25 12.6v5.4M17.75 12.6v5.4" stroke="${tile}" stroke-width="1.5" stroke-linecap="round"/>`,
  ].join('');
}

/** Standalone SVG file of the mark. `radius` 0 gives a full-bleed square (Apple touch icon). */
export function markSvg(size: number, radius = 7): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${markShapes(brand.orange, brand.graphite, radius)}</svg>`;
}
