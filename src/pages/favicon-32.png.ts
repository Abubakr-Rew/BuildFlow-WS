import type { APIRoute } from 'astro';
import { markSvg } from '../lib/brand';
import { svgToPng } from '../lib/images';

// PNG fallback for browsers without SVG favicon support.
export const GET: APIRoute = () =>
  new Response(svgToPng(markSvg(32), 32), { headers: { 'Content-Type': 'image/png' } });
