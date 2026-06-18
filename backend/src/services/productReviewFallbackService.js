import {
  dedupeTrimmed,
  detectPlatform,
  extractAmazonMeta,
  stripHtml,
} from './reviewPlatformUtils.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestPage(url, referer, attempt = 1) {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: referer || url,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (attempt >= 3) {
      throw error;
    }

    await sleep(700 * attempt);
    return requestPage(url, referer, attempt + 1);
  }
}

async function fetchHtml(url, referer) {
  const response = await requestPage(url, referer);

  if (!response.ok) {
    throw new Error(`Ürün sayfası alınamadı: ${response.status}`);
  }

  return response.text();
}

async function fetchHtmlResponse(url, referer) {
  const response = await requestPage(url, referer);

  return {
    status: response.status,
    html: await response.text(),
  };
}

function extractWithPatterns(html, patterns, maxReviews) {
  const matches = [];

  for (const pattern of patterns) {
    let current;
    while ((current = pattern.exec(html)) !== null) {
      matches.push(current[1]);
    }
  }

  return dedupeTrimmed(matches, maxReviews);
}

async function fetchAmazonReviews(parsedUrl, options) {
  const { asin, origin } = extractAmazonMeta(parsedUrl);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const collected = [];
  const seen = new Set();
  const canonicalProductUrl = `${origin}/dp/${asin}`;
  const productPageHtml = await fetchHtml(canonicalProductUrl, origin);
  const productPageReviews = extractWithPatterns(
    productPageHtml,
    [
      /data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi,
      /data-hook="review-collapsed"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi,
      /data-hook="reviewRichContentContainer"[\s\S]*?<span>([\s\S]*?)<\/span>/gi,
      /data-hook="reviewTextContainer"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi,
      /"reviewBody":"([^"]+)"/gi,
    ],
    maxReviews,
  );

  for (const review of productPageReviews) {
    if (seen.has(review)) continue;
    seen.add(review);
    collected.push(review);
    if (collected.length >= maxReviews) {
      return { platform: 'amazon', productRef: asin, reviews: collected };
    }
  }

  const maxPages = Math.min(Number(options.maxPages) || 5, 8);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const url = `${origin}/product-reviews/${asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNumber}`;
    const html = await fetchHtml(url, canonicalProductUrl);
    const pageReviews = extractWithPatterns(
      html,
      [
        /data-hook="review-collapsed"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi,
        /data-hook="reviewRichContentContainer"[\s\S]*?<span>([\s\S]*?)<\/span>/gi,
        /data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi,
        /"reviewBody":"([^"]+)"/gi,
        /"reviewText":"([^"]+)"/gi,
      ],
      maxReviews,
    );

    for (const review of pageReviews) {
      if (seen.has(review)) continue;
      seen.add(review);
      collected.push(review);
      if (collected.length >= maxReviews) {
        return { platform: 'amazon', productRef: asin, reviews: collected };
      }
    }
  }

  if (!collected.length) {
    throw new Error('Amazon yorumları çekilemedi. Amazon sunucu tarafı isteği kısıtlıyor olabilir.');
  }

  return { platform: 'amazon', productRef: asin, reviews: collected };
}

async function fetchTrendyolReviews(parsedUrl, options) {
  const { status, html } = await fetchHtmlResponse(parsedUrl.toString(), parsedUrl.origin);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);

  if (status === 403) {
    throw new Error('Trendyol ürün sayfası sunucu tarafı istekleri engelliyor. Bu platformda doğrudan linkten otomatik çekim şu an koruma nedeniyle başarısız oluyor.');
  }

  const reviews = extractWithPatterns(html, [
    /"comment":"([^"]+)"/gi,
    /"commentText":"([^"]+)"/gi,
    /"reviewText":"([^"]+)"/gi,
    /data-testid="comment-text"[^>]*>([\s\S]*?)</gi,
  ], maxReviews);

  if (!reviews.length) {
    throw new Error('Trendyol yorumları çekilemedi. Sayfa yapısı değişmiş veya yorumlar koruma altında olabilir.');
  }

  return {
    platform: 'trendyol',
    productRef: parsedUrl.pathname,
    reviews,
  };
}

async function fetchHepsiburadaReviews(parsedUrl, options) {
  let html = '';

  try {
    html = await fetchHtml(parsedUrl.toString(), parsedUrl.origin);
  } catch (error) {
    throw new Error(`Hepsiburada ürün sayfasına erişilemedi: ${error.message}`);
  }

  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const reviews = extractWithPatterns(html, [
    /"reviewBody":"([^"]+)"/gi,
  ], maxReviews);

  if (!reviews.length) {
    throw new Error('Hepsiburada yorumları çekilemedi. Sayfa yapısı değişmiş veya yorumlar koruma altında olabilir.');
  }

  return {
    platform: 'hepsiburada',
    productRef: parsedUrl.pathname,
    reviews,
  };
}

export async function fetchProductReviewsFallback(productUrl, options = {}) {
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
    throw new Error('n11 bu sunucu ortamında Cloudflare koruması gösteriyor. Linkten otomatik çekim şu an engelleniyor.');
  }

  if (platform === 'ciceksepeti') {
    throw new Error('Çiçeksepeti bu sunucu ortamında korumalı hata sayfası döndürüyor. Linkten otomatik çekim şu an engelleniyor.');
  }

  return fetchHepsiburadaReviews(parsedUrl, options);
}
