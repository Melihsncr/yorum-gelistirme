export function decodeHtmlEntities(text) {
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

export function stripHtml(text) {
  return decodeHtmlEntities(String(text || '').replace(/<[^>]+>/g, ' '))
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeTrimmed(values, maxReviews) {
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

export function detectPlatform(productUrl) {
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

export function extractAmazonMeta(parsedUrl) {
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
