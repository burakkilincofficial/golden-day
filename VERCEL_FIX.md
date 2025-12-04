# Vercel Production Hatası Düzeltme

## 🔴 Sorun

Production'da üye eklerken hata:
```
The provided API Key is invalid. Reason: Validation of API Key failed.
```

Bu hata, Prisma Accelerate API key'inin geçersiz olduğunu gösterir.

## ✅ Çözüm

Vercel'de environment variable ismi yanlış veya eksik.

### Adım 1: Vercel Dashboard'da Kontrol

1. **Vercel Dashboard** → Projeniz → **Settings** → **Environment Variables**
2. Şu variable'ları kontrol edin:
   - ✅ `DATABASE_URL` (Vercel Postgres connection string)
   - ✅ `POSTGRES_URL` (Direct connection URL)

### Adım 2: Standart Vercel Postgres Kullanın

Prisma Accelerate yerine standart Vercel Postgres kullanın:

1. **Settings** → **Environment Variables**
2. `DATABASE_URL` variable'ını kontrol edin
3. Eğer yoksa, Vercel Postgres oluşturun:
   - **Storage** → **Create Database** → **Postgres**
   - Database oluşturulduğunda `DATABASE_URL` otomatik eklenir

### Adım 3: Redeploy

1. **Deployments** → Son deployment
2. **Redeploy** butonuna tıklayın
3. Veya yeni commit push edin:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for Prisma fix"
   git push
   ```

## 📋 Kontrol Listesi

Vercel'de şu environment variables olmalı:

- [ ] `DATABASE_URL` (Vercel Postgres - otomatik eklenir)
- [ ] `POSTGRES_URL` (Direct connection - otomatik eklenir)
- [ ] `COLLECTAPI_TOKEN` (opsiyonel)

## 🔍 Doğrulama

Deploy sonrası:
1. Sayfayı açın
2. "Üye Ekle" butonuna tıklayın
3. Bir isim girin ve ekleyin
4. Hata olmamalı

## ⚠️ Not

Schema artık `DATABASE_URL` kullanıyor (standart Vercel Postgres). Prisma Accelerate'e gerek yok. Vercel Postgres oluşturduğunuzda `DATABASE_URL` otomatik eklenir.

