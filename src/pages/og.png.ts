import type { APIRoute } from 'astro';
import { renderOgImage } from '../lib/images';

// 1200x630 social preview, generated at build time.
export const GET: APIRoute = async () =>
  new Response(await renderOgImage(), { headers: { 'Content-Type': 'image/png' } });
