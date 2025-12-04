# Vercel Deployment Rehberi - Adım Adım

## 🚀 Hızlı Kurulum

### 1. Vercel Postgres Oluşturma

1. **Vercel Dashboard'a gidin**: https://vercel.com/dashboard
2. Projenizi seçin (veya yeni proje oluşturun)
3. **Storage** sekmesine tıklayın
4. **Create Database** butonuna tıklayın
5. **Postgres** seçeneğini seçin
6. Database adını girin (örn: `golden-day-db`)
7. **Create** butonuna tıklayın

**✅ Otomatik eklenen environment variables:**
- `POSTGRES_PRISMA_URL` (Connection Pooling URL)
- `POSTGRES_URL_NON_POOLING` (Direct Connection URL)

### 2. Vercel KV (Redis) Oluşturma (Opsiyonel - Rate Limiting için)

1. **Storage** sekmesinde
2. **Create Database** → **KV** seçin
3. Database adını girin (örn: `golden-day-kv`)
4. **Create** butonuna tıklayın

**✅ Otomatik eklenen environment variables:**
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3. CollectAPI Token Ekleme

1. **Settings** → **Environment Variables** sekmesine gidin
2. **Add New** butonuna tıklayın
3. Şu bilgileri girin:
   - **Key:** `COLLECTAPI_TOKEN`
   - **Value:** Kendi CollectAPI token'ınızı yapıştırın
   - **Environment:** 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
4. **Save** butonuna tıklayın

### 4. Database Schema'yı Push Etme

Vercel'de ilk deploy'dan sonra database schema'yı oluşturmanız gerekiyor:

**Yöntem 1: Vercel CLI ile (Önerilen)**
```bash
# Vercel CLI'yi yükleyin (eğer yoksa)
npm i -g vercel

# Projeye bağlanın
vercel link

# Database schema'yı push edin
vercel env pull .env.local  # Environment variables'ı çek
npx prisma db push
```

**Yöntem 2: Vercel Dashboard'dan (Kolay)**
1. Vercel Dashboard → Projeniz → **Deployments**
2. Son deployment'a tıklayın
3. **Functions** sekmesine gidin
4. **View Function Logs** ile terminal açın
5. Şu komutu çalıştırın:
```bash
npx prisma db push
```

**Yöntem 3: GitHub Actions veya Vercel Build Command (Otomatik)**
`package.json`'da `build` script'i zaten `prisma generate` içeriyor. İlk deploy'dan sonra manuel olarak `prisma db push` çalıştırmanız gerekiyor.

### 5. İlk Deploy

```bash
# Git'e push edin
git add .
git commit -m "Vercel deployment hazır"
git push origin main

# Vercel otomatik deploy edecek
```

## 🔧 Sorun Giderme

### "Prisma Client not found" hatası
- ✅ `postinstall` script'i `prisma generate` çalıştırıyor
- ✅ Build script'i de `prisma generate` içeriyor
- ✅ `@prisma/client` dependencies'de

### "Environment variable not found: POSTGRES_PRISMA_URL" hatası
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `POSTGRES_PRISMA_URL` ve `POSTGRES_URL_NON_POOLING` var mı kontrol edin
3. Yoksa Vercel Postgres oluşturun (yukarıdaki adım 1)

### "Table does not exist" hatası
- İlk deploy'dan sonra `npx prisma db push` çalıştırın
- Veya Vercel Dashboard'dan terminal açıp çalıştırın

### Build başarısız oluyor
1. **Deployments** → Son deployment → **View Function Logs**
2. Hata mesajını kontrol edin
3. Genellikle:
   - Prisma generate hatası → `postinstall` script çalışıyor mu?
   - Environment variable hatası → Vercel'de ekli mi?

## 📋 Checklist

Deploy öncesi kontrol listesi:

- [ ] Vercel Postgres oluşturuldu
- [ ] `POSTGRES_PRISMA_URL` environment variable eklendi
- [ ] `POSTGRES_URL_NON_POOLING` environment variable eklendi
- [ ] `COLLECTAPI_TOKEN` environment variable eklendi
- [ ] Vercel KV oluşturuldu (opsiyonel)
- [ ] GitHub'a push edildi
- [ ] İlk deploy sonrası `prisma db push` çalıştırıldı

## 🎯 İlk Kullanım

1. Sayfa açıldığında otomatik olarak varsayılan grup oluşturulur
2. Üye ekleyin
3. "Kura Çek" butonuna tıklayın
4. 12 aylık takip otomatik oluşturulur

## 📝 Notlar

- **Local Development:** Vercel Postgres'e local'den bağlanamazsınız. Test için Vercel'e deploy edin veya local PostgreSQL kullanın.
- **Database Schema:** İlk deploy'dan sonra mutlaka `prisma db push` çalıştırın.
- **Environment Variables:** Production, Preview ve Development için ayrı ayrı ekleyebilirsiniz.

