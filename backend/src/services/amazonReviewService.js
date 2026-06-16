function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMatches(html) {
  const matches = [];
  const pattern = /data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
  let current;

  while ((current = pattern.exec(html)) !== null) {
    const cleaned = stripHtml(current[1]);
    if (cleaned) {
      matches.push(cleaned);
    }
  }

  return matches;
}

export function extractAmazonMeta(productUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(productUrl);
  } catch {
    throw new Error('Geçerli bir Amazon ürün linki girin.');
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (!host.includes('amazon.')) {
    throw new Error('Şimdilik sadece Amazon linkleri destekleniyor.');
  }

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
    throw new Error('Amazon linkinden ASIN bilgisi çıkarılamadı.');
  }

  return {
    asin: asin.toUpperCase(),
    origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
  };
}

async function fetchReviewPage({ origin, asin, pageNumber }) {
  const url = `${origin}/product-reviews/${asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNumber}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: origin,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Amazon yorum sayfası alınamadı: ${response.status}`);
  }

  return response.text();
}

export async function fetchAmazonReviews(productUrl, options = {}) {
  const { asin, origin } = extractAmazonMeta(productUrl);
  const maxPages = Math.min(Number(options.maxPages) || 3, 5);
  const maxReviews = Math.min(Number(options.maxReviews) || 30, 100);
  const collected = [];
  const seen = new Set();

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const html = await fetchReviewPage({ origin, asin, pageNumber });
    const pageReviews = extractMatches(html);

    if (!pageReviews.length) {
      break;
    }

    for (const review of pageReviews) {
      if (seen.has(review)) continue;
      seen.add(review);
      collected.push(review);

      if (collected.length >= maxReviews) {
        return { asin, origin, reviews: collected };
      }
    }
  }

  if (!collected.length) {
    throw new Error('Amazon yorumları çekilemedi. Ürün sayfası korumalı olabilir veya link formatı desteklenmiyor olabilir.');
  }

  return { asin, origin, reviews: collected };
}
