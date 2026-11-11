import type { MetadataRoute } from 'next';

const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${base}/` }, { url: `${base}/dat-hang` }];
}
