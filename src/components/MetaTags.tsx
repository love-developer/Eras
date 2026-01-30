import { useEffect } from 'react';

/**
 * MetaTags Component
 * 
 * Sets SEO and social media meta tags dynamically.
 * Note: This approach works for browser title and SEO, but may not work for
 * social media crawlers (Facebook, Twitter) which don't execute JavaScript.
 * 
 * For full social media preview support, the hosting platform needs to:
 * 1. Support server-side rendering (SSR), OR
 * 2. Use prerendering/static generation, OR
 * 3. Configure meta tag injection at the CDN/server level
 */
export function MetaTags() {
  useEffect(() => {
    // Set document title
    document.title = 'Eras - Digital Time Capsule | Capture Today, Unlock Tomorrow';
    
    // Helper function to set or create meta tag
    const setMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Primary Meta Tags
    setMetaTag('meta[name="title"]', 'name', 'Eras - Digital Time Capsule');
    setMetaTag('meta[name="description"]', 'name', 'Create time capsules with photos, videos, and messages. Schedule delivery to your future self and loved ones. Start your journey today, completely free.');
    setMetaTag('meta[name="keywords"]', 'name', 'time capsule, digital time capsule, future self, memory preservation, nostalgia, goal tracking, legacy vault, personal memories');

    // Open Graph / Facebook
    setMetaTag('meta[property="og:type"]', 'property', 'website');
    setMetaTag('meta[property="og:url"]', 'property', 'https://erastimecapsule.com/');
    setMetaTag('meta[property="og:title"]', 'property', 'Eras - Digital Time Capsule');
    setMetaTag('meta[property="og:description"]', 'property', 'Capture today, unlock tomorrow. Create time capsules for your future self and loved ones.');
    setMetaTag('meta[property="og:image"]', 'property', 'https://images.unsplash.com/photo-1704310957636-be5d273c8f0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&h=630');
    setMetaTag('meta[property="og:image:width"]', 'property', '1200');
    setMetaTag('meta[property="og:image:height"]', 'property', '630');
    setMetaTag('meta[property="og:site_name"]', 'property', 'Eras');

    // Twitter Card
    setMetaTag('meta[property="twitter:card"]', 'property', 'summary_large_image');
    setMetaTag('meta[property="twitter:url"]', 'property', 'https://erastimecapsule.com/');
    setMetaTag('meta[property="twitter:title"]', 'property', 'Eras - Digital Time Capsule');
    setMetaTag('meta[property="twitter:description"]', 'property', 'Capture today, unlock tomorrow. Create time capsules for your future self.');
    setMetaTag('meta[property="twitter:image"]', 'property', 'https://images.unsplash.com/photo-1704310957636-be5d273c8f0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&h=630');

    // Theme color for mobile browsers
    setMetaTag('meta[name="theme-color"]', 'name', '#1e1b4b');

    // Apple mobile web app
    setMetaTag('meta[name="apple-mobile-web-app-capable"]', 'name', 'yes');
    setMetaTag('meta[name="apple-mobile-web-app-status-bar-style"]', 'name', 'black-translucent');
    setMetaTag('meta[name="apple-mobile-web-app-title"]', 'name', 'Eras');

    console.log('✅ Meta tags set dynamically');
  }, []);

  return null;
}
