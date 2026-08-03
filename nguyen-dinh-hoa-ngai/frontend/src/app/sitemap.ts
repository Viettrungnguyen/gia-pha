/**
 * @project NguyenDinhHoaNgai
 * @file src/app/sitemap.ts
 * @description Public sitemap routes
 * @version 1.1.0
 * @updated 2026-07-24
 */

import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/cay-gia-pha`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/thanh-vien`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/danh-ba`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/lich-cung-le`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/stats`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tai-lieu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
