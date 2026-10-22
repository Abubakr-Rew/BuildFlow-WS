import type { APIRoute } from 'astro';
import { markSvg } from '../lib/brand';

export const GET: APIRoute = () =>
  new Response(markSvg(32), { headers: { 'Content-Type': 'image/svg+xml' } });
