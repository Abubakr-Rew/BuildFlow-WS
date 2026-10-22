import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

// Allows everything and points crawlers to the sitemap built from siteUrl.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase('sitemap-index.xml'), site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
