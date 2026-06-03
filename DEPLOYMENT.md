# Canlıya Alma Notları

## CSV nedir?

CSV, tablo verisini düz metin olarak taşıyan bir dosya formatıdır.
Bu projede CSV şu iş için kullanılır:

- toplu müşteri yorumlarını yüklemek
- `yorum` sütunundaki satırları tek seferde analiz etmek
- sonuçları tekrar CSV veya Excel olarak dışa aktarmak

Örnek CSV:

```csv
yorum
Kargo çok geç geldi ama ürün sağlamdı
Paketleme güzeldi, teşekkür ederim
İade süreci beklediğimden yavaştı
```

## Canlı mimari

- `frontend`: Vercel
- `backend API`: Render Web Service
- `database`: Render PostgreSQL
- `domain`: İstersen sonra Vercel veya Render üstünden özel alan adı bağlanır

## Domain ve host ne demek?

- `host`: sitenin yayınlandığı sunucu/platform
- `domain`: insanların yazdığı web adresi

Örnek:

- host: `Vercel`
- domain: `yorumanalizi.com`

Geçici canlı adresler önce platformdan gelir:

- frontend: `https://your-project.vercel.app`
- backend: `https://your-backend.onrender.com`

Sonra istersen özel domain bağlanır.

## 1. Backend - Render

Render'da yeni bir `Web Service` aç:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Env değişkenleri:

- `NODE_ENV=production`
- `PORT=10000`
- `FRONTEND_URL=https://your-project.vercel.app`
- `GEMINI_API_KEY=...`
- `GROQ_API_KEY=...`
- `DEEPSEEK_API_KEY=...`
- `AUTH_SECRET=guclu_bir_gizli_anahtar`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_SUCCESS_URL=https://your-project.vercel.app/pricing?payment=success`
- `STRIPE_CANCEL_URL=https://your-project.vercel.app/pricing?payment=cancel`
- `DATABASE_URL` Render PostgreSQL bağlantısından gelir

Not:

- `backend/render.yaml` dosyası Render blueprint için hazırlandı.

## 2. Veritabanı - Render PostgreSQL

Render içinde yeni bir PostgreSQL oluştur:

- Database Name: `yorum_db`
- User: platform otomatik verir

Sonra `DATABASE_URL` değerini backend service'e bağla.

## 3. Frontend - Vercel

Vercel'de projeyi import et:

- Root Directory: `frontend`
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Frontend env:

- `VITE_API_URL=https://your-backend.onrender.com`

Not:

- `frontend/vercel.json` SPA rewrite için hazır.

## 4. Sıralı yayın akışı

1. önce Render PostgreSQL oluştur
2. sonra backend'i Render'a deploy et
3. backend URL çıktıktan sonra Vercel'de `VITE_API_URL` gir
4. frontend'i deploy et
5. backend `FRONTEND_URL` değerini gerçek Vercel adresiyle güncelle
6. test et

## 5. Kontrol listesi

Canlıda bunları test et:

- kayıt ol
- giriş yap
- tek yorum analizi
- agresif ton
- toplu CSV yükleme
- geçmiş kayıtları
- pricing ekranı
- Stripe yönlendirmesi

