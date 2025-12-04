# Vercel Deployment Kurulum Rehberi

## 1. Vercel KV (Redis) Kurulumu

### Adımlar:
1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin veya yeni proje oluşturun
3. **Storage** sekmesine gidin
4. **Create Database** → **KV** seçin
5. Database adını girin (örn: `gold-day-kv`)
6. **Create** butonuna tıklayın

### Environment Variables (Otomatik Eklenir):
Vercel KV oluşturulduğunda şu değişkenler otomatik eklenir:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 2. CollectAPI Token Ekleme

### Adımlar:
1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. Yeni variable ekleyin:
   - **Name:** `COLLECTAPI_TOKEN`
   - **Value:** Kendi CollectAPI token'ınızı buraya yapıştırın
   - **Environment:** Production, Preview, Development (hepsini seçin)
3. **Save** butonuna tıklayın

## 3. Local Development için .env.local

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
COLLECTAPI_TOKEN=your_collectapi_token_here

# Vercel KV için (local'de çalışmaz, sadece production'da)
# KV_REST_API_URL=
# KV_REST_API_TOKEN=
# KV_REST_API_READ_ONLY_TOKEN=
```

**Not:** Local development'ta Vercel KV çalışmaz. Bu yüzden local'de her zaman API isteği atılır (rate limiting olmaz). Production'da Vercel KV otomatik çalışır.

## 4. Deploy

```bash
# Git'e push edin
git add .
git commit -m "CollectAPI entegrasyonu eklendi"
git push

# Vercel otomatik deploy edecek
# veya manuel:
vercel --prod
```

## Özellikler

- ✅ **Günlük 3 istek limiti:** CollectAPI ayda 100 istek hakkı veriyor (~günde 3)
- ✅ **Cache mekanizması:** 8 saatlik cache ile gereksiz istekler önlenir
- ✅ **Rate limiting:** Vercel KV ile günlük istek sayısı takip edilir
- ✅ **Fallback:** API başarısız olursa mock data kullanılır

## Test

Deploy sonrası:
1. İlk sayfa yüklemesinde CollectAPI'ye istek atılır
2. Sonraki 8 saat içinde cache'den döner (yeni istek atılmaz)
3. 8 saat sonra tekrar istek atılır (günlük limit kontrolü yapılır)

