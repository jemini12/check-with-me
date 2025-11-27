/**
 * Structured Data (JSON-LD) component for SEO
 * Provides rich snippets for search engines
 */
export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://chqwm.vercel.app/#webapp',
        name: 'Check with me',
        alternateName: '확인해 보세요',
        url: 'https://chqwm.vercel.app',
        description: 'Fast, AI-powered fact-checking tool. Verify claims, detect misinformation, and get accurate answers with citations.',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'AI-powered fact checking',
          'Multi-language support',
          'Real-time verification',
          'Source citations',
          'Question answering',
          'Dream mode for creative exploration',
        ],
        screenshot: 'https://chqwm.vercel.app/og-image.png',
        inLanguage: ['en', 'ko'],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://chqwm.vercel.app/#website',
        url: 'https://chqwm.vercel.app',
        name: 'Check with me',
        description: 'AI-powered fact checker and verification tool',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://chqwm.vercel.app/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://chqwm.vercel.app?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: ['en', 'ko'],
      },
      {
        '@type': 'Organization',
        '@id': 'https://chqwm.vercel.app/#organization',
        name: 'Check with me',
        url: 'https://chqwm.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://chqwm.vercel.app/logo.png',
          width: 512,
          height: 512,
        },
        sameAs: [
          'https://twitter.com/checkwithme',
          'https://github.com/jemini12/check-with-me',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://chqwm.vercel.app/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://chqwm.vercel.app',
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
