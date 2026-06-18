import {
  dedupeTrimmed,
  detectPlatform,
  extractAmazonMeta,
  stripHtml,
} from './reviewPlatformUtils.js';

let playwrightModulePromise;

async function getPlaywright() {
  if (!playwrightModulePromise) {
    playwrightModulePromise = import('playwright').catch(() => null);
  }

  const playwright = await playwrightModulePromise;
  if (!playwright?.chromium) {
    throw new Error('Playwright bağımlılığı kurulu değil.');
  }

  return playwright;
}

async function withBrowser(task) {
  const { chromium } = await getPlaywright();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      locale: 'tr-TR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      viewport: { width: 1440, height: 2200 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    return await task(page);
  } finally {
    await browser.close();
  }
}

async function preparePage(page, url) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(1800);
}

async function dismissCommonPopups(page) {
  const selectors = [
    'button:has-text("Kabul Et")',
    'button:has-text("Kabul ediyorum")',
    'button:has-text("Accept")',
    'button#sp-cc-accept',
    'input#sp-cc-accept',
    '[id*="onetrust-accept"]',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 800 })) {
        await button.click({ timeout: 1000 });
        await page.waitForTimeout(400);
      }
    } catch {
      // Popup yoksa devam.
    }
  }
}

async function extractTextList(page, selectors, maxReviews) {
  const values = [];

  for (const selector of selectors) {
    try {
      const texts = await page.locator(selector).evaluateAll((nodes) =>
        nodes.map((node) => node.textContent || ''),
      );
      values.push(...texts);
    } catch {
      // Bu selector o sayfada yoksa diğerine geç.
    }
  }

  return dedupeTrimmed(values, maxReviews);
}

async function fetchAmazonReviews(parsedUrl, options) {
  const { asin, origin } = extractAmazonMeta(parsedUrl);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const maxPages = Math.min(Number(options.maxPages) || 4, 8);

  return withBrowser(async (page) => {
    const reviewUrl = `${origin}/product-reviews/${asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews`;
    const collected = [];
    const seen = new Set();

    await preparePage(page, parsedUrl.toString());
    await dismissCommonPopups(page);

    const pageHtml = await page.content();
    const showAllMatch = pageHtml.match(new RegExp(`href=\\\\?"([^\\\\"]*product-reviews\\/${asin}[^\\\\"]*(?:show_all_top|show_all_btm)[^\\\\"]*)\\\\?"`, 'i'));
    const preferredReviewUrl = showAllMatch?.[1]
      ? `${origin}${showAllMatch[1].replace(/&amp;/g, '&')}`
      : reviewUrl;

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const separator = preferredReviewUrl.includes('?') ? '&' : '?';
      const pageUrl = `${preferredReviewUrl}${separator}pageNumber=${pageNumber}`;
      try {
        await preparePage(page, pageUrl);
        await dismissCommonPopups(page);
      } catch (error) {
        if (collected.length) {
          break;
        }

        throw error;
      }

      const reviewTexts = await extractTextList(
        page,
        [
          '[data-hook="review-body"] span',
          '[data-hook="review-collapsed"] span',
          '[data-hook="reviewBody"] span',
        ],
        maxReviews,
      );

      for (const review of reviewTexts) {
        if (seen.has(review)) continue;
        seen.add(review);
        collected.push(review);
        if (collected.length >= maxReviews) {
          return { platform: 'amazon', productRef: asin, reviews: collected };
        }
      }

      const blocked = await page.locator('text=/robot|captcha|giriş yap|sign in|oturum aç/i').first().isVisible({ timeout: 500 }).catch(() => false);
      if (blocked && !collected.length) {
        throw new Error('Amazon yorum sayfası oturum açma veya koruma duvarı gösterdi. Bu ortamda tüm yorumlara erişim sağlanamadı.');
      }
    }

    if (!collected.length) {
      throw new Error('Amazon yorumları Playwright ile alınamadı.');
    }

    return { platform: 'amazon', productRef: asin, reviews: collected };
  });
}

async function fetchTrendyolReviews(parsedUrl, options) {
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);

  return withBrowser(async (page) => {
    await preparePage(page, parsedUrl.toString());
    await dismissCommonPopups(page);

    const reviews = await extractTextList(
      page,
      [
        '[data-testid="comment-text"]',
        '.comment-text',
        '.user-comment-body',
      ],
      maxReviews,
    );

    if (!reviews.length) {
      const html = await page.content();
      const inlineMatches = [...html.matchAll(/"commentText":"([^"]+)"/g)].map((match) => stripHtml(match[1]));
      const deduped = dedupeTrimmed(inlineMatches, maxReviews);
      if (deduped.length) {
        return {
          platform: 'trendyol',
          productRef: parsedUrl.pathname,
          reviews: deduped,
        };
      }

      throw new Error('Trendyol yorumları Playwright ile alınamadı. Sayfa koruması veya yeni DOM yapısı nedeniyle boş dönmüş olabilir.');
    }

    return {
      platform: 'trendyol',
      productRef: parsedUrl.pathname,
      reviews,
    };
  });
}

async function fetchHepsiburadaReviews(parsedUrl, options) {
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);

  return withBrowser(async (page) => {
    await preparePage(page, parsedUrl.toString());
    await dismissCommonPopups(page);

    const reviews = await extractTextList(
      page,
      [
        '[data-test-id="review-content"]',
        '.hermes-ReviewCard-module-HermesReviewCardText',
        '.review-text',
      ],
      maxReviews,
    );

    if (!reviews.length) {
      const html = await page.content();
      const inlineMatches = [...html.matchAll(/"reviewBody":"([^"]+)"/g)].map((match) => stripHtml(match[1]));
      const deduped = dedupeTrimmed(inlineMatches, maxReviews);
      if (deduped.length) {
        return {
          platform: 'hepsiburada',
          productRef: parsedUrl.pathname,
          reviews: deduped,
        };
      }

      throw new Error('Hepsiburada yorumları Playwright ile alınamadı. Koruma veya DOM değişikliği olabilir.');
    }

    return {
      platform: 'hepsiburada',
      productRef: parsedUrl.pathname,
      reviews,
    };
  });
}

async function fetchN11Reviews() {
  throw new Error('n11 bu sunucu ortamında Cloudflare koruması gösteriyor. Playwright ile de ürün sayfasına stabil erişim sağlanamadı.');
}

async function fetchCiceksepetiReviews() {
  throw new Error('Çiçeksepeti koruma sayfası döndürüyor. Playwright ile ürün yorumları bu ortamda alınamadı.');
}

export async function fetchProductReviewsWithPlaywright(productUrl, options = {}) {
  const { platform, parsedUrl } = detectPlatform(productUrl);

  if (platform === 'amazon') {
    return fetchAmazonReviews(parsedUrl, options);
  }

  if (platform === 'trendyol') {
    return fetchTrendyolReviews(parsedUrl, options);
  }

  if (platform === 'hepsiburada') {
    return fetchHepsiburadaReviews(parsedUrl, options);
  }

  if (platform === 'n11') {
    return fetchN11Reviews(parsedUrl, options);
  }

  return fetchCiceksepetiReviews(parsedUrl, options);
}
