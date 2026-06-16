function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>');
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || '').replace(/<[^>]+>/g, ' '))
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchHtml(url, referer) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: referer || url,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Ürün sayfası alınamadı: ${response.status}`);
  }

  return response.text();
}

function dedupeTrimmed(values, maxReviews) {
  const reviews = [];
  const seen = new Set();

  for (const value of values) {
    const cleaned = stripHtml(value);
    if (!cleaned || cleaned.length < 12 || seen.has(cleaned)) continue;
    seen.add(cleaned);
    reviews.push(cleaned);
    if (reviews.length >= maxReviews) break;
  }

  return reviews;
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

function detectPlatform(productUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(productUrl);
  } catch {
    throw new Error('Geçerli bir ürün linki girin.');
  }

  const host = parsedUrl.hostname.toLowerCase();

  if (host.includes('amazon.')) {
    return { platform: 'amazon', parsedUrl };
  }

  if (host.includes('trendyol.')) {
    return { platform: 'trendyol', parsedUrl };
  }

  if (host.includes('hepsiburada.')) {
    return { platform: 'hepsiburada', parsedUrl };
  }

  throw new Error('Şimdilik sadece Amazon, Trendyol ve Hepsiburada linkleri destekleniyor.');
}

function extractAmazonMeta(parsedUrl) {
  const asinPatterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product-reviews\/([A-Z0-9]{10})/i,
  ];

  const source = `${parsedUrl.pathname}${parsedUrl.search}`;
  const asin = asinPatterns
    .map((pattern) => source.match(pattern)?.[1])
    .find(Boolean);

  if (!asin) {
    throw new Error('Amazon linkinden ürün kodu çıkarılamadı.');
  }

  return {
    asin: asin.toUpperCase(),
    origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
  };
}

async function fetchAmazonReviews(parsedUrl, options) {
  const { asin, origin } = extractAmazonMeta(parsedUrl);
  const maxPages = Math.min(Number(options.maxPages) || 3, 5);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const collected = [];
  const seen = new Set();

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const url = `${origin}/product-reviews/${asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNumber}`;
    const html = await fetchHtml(url, origin);
    const pageReviews = extractWithPatterns(
      html,
      [/data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi],
      maxReviews,
    );

    if (!pageReviews.length) break;

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
    throw new Error('Amazon yorumları çekilemedi. Ürün sayfası korumalı olabilir veya yorumlar sunucuya kapalı olabilir.');
  }

  return { platform: 'amazon', productRef: asin, reviews: collected };
}

async function fetchTrendyolReviews(parsedUrl, options) {
  const html = await fetchHtml(parsedUrl.toString(), parsedUrl.origin);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
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
  const html = await fetchHtml(parsedUrl.toString(), parsedUrl.origin);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const reviews = extractWithPatterns(html, [
    /"reviewText":"([^"]+)"/gi,
    /"comment":"([^"]+)"/gi,
    /"content":"([^"]+)"/gi,
    /data-test-id="review-content"[^>]*>([\s\S]*?)</gi,
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

export async function fetchProductReviews(productUrl, options = {}) {
  const { platform, parsedUrl } = detectPlatform(productUrl);

  if (platform === 'amazon') {
    return fetchAmazonReviews(parsedUrl, options);
  }

  if (platform === 'trendyol') {
    return fetchTrendyolReviews(parsedUrl, options);
  }

  return fetchHepsiburadaReviews(parsedUrl, options);
}
