import type { APIRoute } from 'astro';
import { markSvg } from '../lib/brand';
import { svgToPng } from '../lib/images';

// Home-screen icon: full-bleed square, iOS rounds the corners itself.
export const GET: APIRoute = () =>
  new Response(svgToPng(markSvg(180, 0), 180), { headers: { 'Content-Type': 'image/png' } });
