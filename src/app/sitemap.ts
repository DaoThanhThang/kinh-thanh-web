import type { MetadataRoute } from 'next';

const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/dat-hang', '/lien-he', '/thong-tin'].map((p) => ({
    url: p === '/' ? `${base}/` : `${base}${p}`,
  }));
}
