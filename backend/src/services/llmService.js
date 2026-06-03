import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export const MODEL_NAMES = {
  gemini: 'Google Gemini 2.5',
  llama: 'Groq Llama 3.3 (70B)',
  openrouter: 'OpenRouter Free',
};

const VALID_SENTIMENTS = new Set(['Pozitif', 'Negatif', 'Notr', 'Nötr']);
const VALID_CATEGORIES = new Set([
  'Kargo',
  'Urun Kalitesi',
  'Ürün Kalitesi',
  'Fiyat',
  'Musteri Hizmetleri',
  'Müşteri Hizmetleri',
  'Genel',
]);

function buildPrompt(comment, tone) {
  return `Asagidaki musteri yorumunu analiz et.
Yorum: "${comment}"
Cevap tonu: ${tone}

Cevabi tam olarak su formatta ver. Aralarina | koy ve baska hicbir sey yazma:
DUYGU|KATEGORI|OZET|CEVAP

Kurallar:
1. DUYGU sadece su degerlerden biri olmali: Pozitif, Negatif, Notr
2. KATEGORI sadece su degerlerden biri olmali: Kargo, Urun Kalitesi, Fiyat, Musteri Hizmetleri, Genel
3. OZET tek cumle olmali
4. CEVAP musteriye ${tone} tonda yazilmali
5. Sadece 4 parca don, ekstra aciklama ekleme`;
}

function normalizeLabel(value, fallback) {
  const map = {
    Notr: 'Nötr',
    Nötr: 'Nötr',
    'Urun Kalitesi': 'Ürün Kalitesi',
    'Ürün Kalitesi': 'Ürün Kalitesi',
    'Musteri Hizmetleri': 'Müşteri Hizmetleri',
    'Müşteri Hizmetleri': 'Müşteri Hizmetleri',
  };

  return map[value] || value || fallback;
}

function parseResponse(raw) {
  const normalizedRaw = String(raw || '').replace(/\r/g, '').trim();
  const lines = normalizedRaw.split('\n');

  for (const line of lines) {
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length >= 4 && VALID_SENTIMENTS.has(parts[0])) {
      return {
        sentiment: normalizeLabel(parts[0], 'Nötr'),
        category: normalizeLabel(VALID_CATEGORIES.has(parts[1]) ? parts[1] : 'Genel', 'Genel'),
        summary: parts[2],
        reply: parts[3],
      };
    }
  }

  const parts = normalizedRaw.replace(/\n/g, ' ').split('|').map((part) => part.trim());
  for (let index = 0; index < parts.length; index += 1) {
    if (VALID_SENTIMENTS.has(parts[index]) && index + 3 < parts.length) {
      return {
        sentiment: normalizeLabel(parts[index], 'Nötr'),
        category: normalizeLabel(VALID_CATEGORIES.has(parts[index + 1]) ? parts[index + 1] : 'Genel', 'Genel'),
        summary: parts[index + 2],
        reply: parts[index + 3],
      };
    }
  }

  return {
    sentiment: 'Nötr',
    category: 'Genel',
    summary: 'Format hatasi',
    reply: normalizedRaw.slice(0, 300),
  };
}

function isRetryableProviderError(message = '') {
  return /503|429|high demand|unavailable|temporarily|timeout/i.test(message);
}

async function analyzeWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API anahtari eksik');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return parseResponse(result.response.text().trim());
}

async function analyzeWithLlama(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API anahtari eksik');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
  });

  return parseResponse((response.choices[0]?.message?.content || '').trim());
}

async function analyzeWithOpenRouter(prompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API anahtari eksik');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'Yorum Gelistirme',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      models: ['openrouter/horizon-beta'],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API hatasi: ${response.status}`);
  }

  const data = await response.json();
  return parseResponse((data.choices?.[0]?.message?.content || '').trim());
}

const ANALYZERS = {
  gemini: analyzeWithGemini,
  llama: analyzeWithLlama,
  openrouter: analyzeWithOpenRouter,
};

export async function analyzeComment(comment, tone, modelKey) {
  const prompt = buildPrompt(comment, tone);

  try {
    const primaryAnalyzer = ANALYZERS[modelKey];
    if (!primaryAnalyzer) {
      throw new Error('Gecersiz model anahtari');
    }

    try {
      return await primaryAnalyzer(prompt);
    } catch (primaryError) {
      if (!isRetryableProviderError(primaryError.message) || modelKey !== 'gemini') {
        throw primaryError;
      }

      const fallbackOrder = ['llama', 'openrouter'];
      for (const fallbackKey of fallbackOrder) {
        const fallbackAnalyzer = ANALYZERS[fallbackKey];
        if (!fallbackAnalyzer) continue;

        try {
          const fallbackResult = await fallbackAnalyzer(prompt);
          return {
            ...fallbackResult,
            fallbackModel: MODEL_NAMES[fallbackKey],
            fallbackReason: primaryError.message,
          };
        } catch {
          // Try the next fallback provider.
        }
      }

      throw primaryError;
    }
  } catch (error) {
    return { error: error.message };
  }
}

export function getApiStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    llama: Boolean(process.env.GROQ_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  };
}
