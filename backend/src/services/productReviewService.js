import { fetchProductReviewsFallback } from './productReviewFallbackService.js';
import { fetchProductReviewsWithPlaywright } from './playwrightReviewService.js';

export async function fetchProductReviews(productUrl, options = {}) {
  const preferBrowser = process.env.PLAYWRIGHT_REVIEW_SCRAPER !== 'false';

  if (preferBrowser) {
    try {
      const result = await fetchProductReviewsWithPlaywright(productUrl, options);
      return { ...result, scraper: 'playwright' };
    } catch (playwrightError) {
      try {
        const fallbackResult = await fetchProductReviewsFallback(productUrl, options);
        return {
          ...fallbackResult,
          scraper: 'http-fallback',
          scraperWarning: playwrightError.message,
        };
      } catch (_fallbackError) {
        throw new Error('Ürün yorumları alınamadı. Link korumalı olabilir veya geçici olarak erişilemiyor olabilir.');
      }
    }
  }

  return fetchProductReviewsFallback(productUrl, options);
}
