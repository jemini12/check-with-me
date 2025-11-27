import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://chqwm.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          en: 'https://chqwm.vercel.app',
          ko: 'https://chqwm.vercel.app',
        },
      },
    },
    {
      url: 'https://chqwm.vercel.app/help',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: 'https://chqwm.vercel.app/help',
          ko: 'https://chqwm.vercel.app/help',
        },
      },
    },
  ];
}
